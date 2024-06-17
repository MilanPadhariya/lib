
export type WherePrimitive=null|boolean|string|number|Date;
export type WhereCondition=['='|'<'|'<='|'>'|'>=',WherePrimitive]|['in',WherePrimitive[]];
export type WhereTable<Key extends string=string>={
	[P in Key]?: WherePrimitive|(WhereCondition[]);
}|null;

export const whereOps:WhereCondition[0][]=[
	'<',
	'<=',
	'=',
	'>',
	'>=',
	'in',
];

function toPrimitive(
	v:WherePrimitive,
	strQuote:string,
){
	if(v instanceof Date)
		return v.toISOString();
	if(v===null)
		return null;
	if(typeof(v)==='number')
		return v;
	if(typeof(v)==='boolean')
		return v;
	if(typeof(v)==='string'){
		if(strQuote){
			v=v.replaceAll('\\','\\\\');
			v=v.replaceAll(strQuote,'\\'+strQuote);
			v=`${strQuote}${v}${strQuote}`;
		}
		return v;
	}
	throw Error('invalid value '+JSON.stringify(v));
}

const validOps:Record<WhereCondition[0],true>={
	'<': true,
	'<=': true,
	'=': true,
	'>': true,
	'>=': true,
	'in': true,
};

export function stringifyWhereTable(
	table:WhereTable,
	options:{
		colQuote?:string;
		strQuote?:string;
		values?:(null|boolean|string|number)[];
	},
){
	if(!table)
		return 'true';
	const conditionTable:Record<string,WhereCondition[]>={};
	let count=0;
	for(const [col,val] of Object.entries(table)){
		count+=1;
		if(Array.isArray(val)){
			conditionTable[col]=val;
		}else{
			conditionTable[col]=[['=',val]];
		}
	}
	if(count===0)
		return 'true';

	const pieces=Object.entries(conditionTable).map(([col,conditions])=>{
		if(options.colQuote){
			col=col.replaceAll('\\','\\\\');
			col=col.replaceAll(options.colQuote,'\\'+options.colQuote);
			col=`${options.colQuote}${col}${options.colQuote}`;
		}else{
			if(!col.match(/^[a-zA-Z][a-zA-Z0-9]+$/))
				throw Error('column not alphnumeric '+JSON.stringify(col));
		}
		let piece=conditions.map((condition)=>{
			if(condition[0]==='in'){
				let vals=condition[1]
				if(!Array.isArray(vals))
					throw Error(`'in' value not array`);
				vals=vals.map(v=>toPrimitive(v,options.strQuote));
				return `${col} in (${vals.join(',')})`;
			}

			let [op,val]=condition;
			if(!validOps[op])
				throw Error('unknown op '+JSON.stringify(op));

			val=toPrimitive(val,options.strQuote);
			if(op==='=' && val===null){
				return `${col} is null`
			}

			if(options.values){
				const i=options.values.push(val);
				val='$'+i;
			}
			return `${col}${op}${val}`;
		}).join(' and ');
		piece=`(${piece})`;
		return piece;
	});
	return pieces.join(' and ');
}

function validatePrimitive(v:WherePrimitive){
	if(v instanceof Date)
		return;
	if(v===null)
		return;
	if(typeof(v)==='number')
		return;
	if(typeof(v)==='boolean')
		return;
	if(typeof(v)==='string')
		return;
	throw Error('invalid value '+JSON.stringify(v));
}

export function validateWhereTable(
	table:unknown,
	validCols:string[],
){
	if(!table)
		return;
	if(typeof(table)!=='object')
		throw Error('not table');

	for(const [col,val] of Object.entries(table)){
		if(!validCols.includes(col))
			throw Error('invalid column '+JSON.stringify(col));
		if(Array.isArray(val)){
			const conditions=val;
			for(const condition of conditions){
				if(!(Array.isArray(condition) && condition.length===2))
					throw Error('invalid condition '+JSON.stringify(condition));

				if(condition[0]==='in'){
					let vals=condition[1];
					if(!Array.isArray(vals))
						throw Error(`'in' value not array`);
					for(const val of vals)
						validatePrimitive(val);
					continue;
				}

				const [op,val]=condition;
				if(!validOps[<WhereCondition[0]>op])
					throw Error('invalid operator '+JSON.stringify(op));
				validatePrimitive(val);
			}
		}else{
			validatePrimitive(val);
		}
	}
}
