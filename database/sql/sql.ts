import {WhereTable,stringifyWhereTable} from '../../where';

class _Error extends Error{
}
export {_Error as Error};

export interface TableDesc{
	name:string;
}

export type ColumnType='boolean'|'date'|'enum'|'inet'|'int'|'number'|'serial'|'string'|'timeStep'|'vec2'|'vec3';

export interface ColumnDesc{
	name:string;
	type:ColumnType;
	notNull?:boolean;
	typeLength?:[number,number];
	default?:string|number|boolean|Date;
	uniqueKey?:boolean;
	index?:boolean;
	members?:string[];
}

export namespace ColumnDesc{
	const keys:Record<keyof ColumnDesc,true>={
		name: true,
		type: true,
		notNull: true,
		typeLength: true,
		default: true,
		uniqueKey: true,
		index: true,
		members: true,
	};

	export function cleanInterface(_in:ColumnDesc):ColumnDesc{
		const out:Record<string,any>={};
		for(const key in _in){
			if(keys[<keyof ColumnDesc>key]){
				out[key]=_in[<keyof ColumnDesc>key]
			}
		}
		return <ColumnDesc>out;
	}
}

export abstract class Statement{
	public constructor(
		protected db:Db,
	){
	}

	protected readonly args:(string|number|boolean)[]=[];

	public abstract exec():Promise<any>;
}

abstract class WhereStatement extends Statement{
	protected _where:WhereTable|string;

	protected buildSql(){
		if(this._where===undefined)
			throw new _Error('missing where');

		let where=this._where;
		if(typeof(where)!=='string'){
			where=stringifyWhereTable(where,{
				colQuote: '"',
				values: this.args,
			});
		}
		let sql=`where ${where}`;
		return sql;
	}

	public all(){
		this._where=null;
		return this;
	}

	public where(table:WhereTable|string){
		this._where=table ?? null;
		return this;
	}

}

abstract class WhereFromStatement extends WhereStatement{
	protected _from:string;

	protected buildSql(){
		if(!this._from)
			throw new _Error('missing from');
		let sql=super.buildSql();
		const from=JSON.stringify(this._from);
		sql=`from ${from} ${sql}`;
		return sql;
	}
}

export class SelectStatement extends WhereFromStatement{
	public constructor(
		db:Db,
		protected _fields:string[]|null,
	){
		super(db);
	}

	protected _orderBy:Record<string,'+'|'-'>;
	protected _offset:number;
	protected _limit:number;

	public from(from:string){
		this._from=from;
		return this;
	}

	public orderBy(orderBy:Record<string,'+'|'-'>){
		this._orderBy=orderBy;
		return this;
	}

	public offset(offset:number){
		this._offset=offset;
		return this;
	}

	public limit(length:number){
		this._limit=length;
		return this;
	}	
	
	protected buildSql():string{
		let sql=super.buildSql();
		let _select='*';
		if(this._fields){
			_select=JSON.stringify(this._fields);
			_select=_select.substring(1,_select.length-1);
		}
		sql=`select ${_select} ${sql}`;
		if(this._orderBy){
			const orderBy=Object.entries(this._orderBy)
				.map(([column,dir])=>[JSON.stringify(column),dir==='-'?'desc':'asc'].join(' '))
				.join(',');
			sql+=` order by ${orderBy}`;
		}
		if(typeof(this._offset)==='number')
			sql+=` offset ${this._offset}`;
		if(typeof(this._limit)==='number')
			sql+=` limit ${this._limit}`;
		return sql;
	}

	public exec<Row extends QueryRow=Record<string,any>>(){
		const sql=this.buildSql();
		return this.db.query<Row>(sql,this.args);
	}
}

export class CountStatement extends WhereFromStatement{
	public constructor(
		db:Db,
		from:string,
	){
		super(db);
		this._from=from;
	}

	protected buildSql():string{
		let sql=super.buildSql();
		let _select='count(*)';
		sql=`select ${_select} ${sql}`;
		return sql;
	}

	public async exec(){
		const sql=this.buildSql();
		const rows=await this.db.query(sql,this.args);
		if(rows && rows[0]){
			return +rows[0]['count'];
		}
		return null;
	}
}

export class DeleteStatement extends WhereFromStatement{
	public constructor(
		db:Db,
		from:string,
	){
		super(db);
		this._from=from;
	}

	protected buildSql():string{
		let sql=super.buildSql();
		sql=`delete ${sql}`;
		return sql;
	}

	public exec(){
		const sql=this.buildSql();
		return this.db.exec(sql,this.args);
	}	
}

export class UpdateStatement extends WhereStatement{
	public constructor(
		db:Db,
		protected _table:string,
	){
		super(db);
	}

	protected _values:Record<string,string|number|boolean|Date>;
	
	public values(values:Record<string,string|number|boolean|Date>){
		this._values={...values};		
		return this;
	}
	
	protected buildSql():string{
		let sql=super.buildSql();

		const table=JSON.stringify(this._table);

		const values=Object.entries(this._values).map(([column,v])=>{
			column=JSON.stringify(column);
			if(v instanceof Date)
				v=v.toISOString();
			const i=this.args.push(v);
			return `${column}=$${i}`;
		}).join(',');

		sql=`update ${table} set ${values} ${sql}`;
		return sql;
	}

	public exec(){
		const sql=this.buildSql();
		return this.db.exec(sql,this.args);
	}	

}

type ValueTable=Record<string,string|number|boolean|Date>;
export class InsertStatement extends Statement{
	public constructor(
		db:Db,
		private readonly into:string
	){
		super(db);
	}

	protected _values:ValueTable[]
	
	public values(
		values:ValueTable|ValueTable[]
	){
		if(Array.isArray(values))
			this._values=values;
		else
			this._values=[values];
		return this;
	}
	
	protected buildSql():string{
		const into=JSON.stringify(this.into);
		const keys:string[]=[];
		const columnNames:string[]=[];
		const valueVars:string[][]=[];
		for(const key in this._values[0]){
			keys.push(key);
			columnNames.push(JSON.stringify(key));
		}
		for(const row of this._values){
			valueVars.push(keys.map(key=>{
				let value=row[key];
				if(value instanceof Date)
					value=value.toISOString();
				const i=this.args.push(value);
				return `$${i}`;
			}));
		}
		const values=valueVars.map(vars=>`(${vars})`).join(',');
		return `insert into ${into} (${columnNames.join(',')}) values ${values} returning "id"`;
	}

	public async exec(){
		const sql=this.buildSql();
		const rows=await this.db.query<{id?:number}>(sql,this.args);
		if(rows)
			return rows.map(({id})=>id);
		return null;
	}		
}

export type QueryRow={
}

export abstract class Db{
	public abstract query<Row extends QueryRow=Record<string,any>>(sql:string, args?:(string|number|boolean)[]):Promise<Row[]>;
	public abstract exec(sql:string, args?:(string|number|boolean)[]):Promise<number>;
	public abstract getTables():Promise<TableDesc[]>;
	public abstract getColumn(tableName:string, column:string):Promise<ColumnDesc>;
	public abstract getColumns(tableName:string):Promise<ColumnDesc[]>;
	public abstract createTable(tableName:string, columns:ColumnDesc[]):Promise<void>;
	public abstract addColumn(tableName:string, column:ColumnDesc):Promise<void>;
	public abstract alterColumn(tableName:string, column:ColumnDesc):Promise<void>;

	public select(fields?:Iterable<string>){
		if(fields)
			return new SelectStatement(this,[...fields]);
		return new SelectStatement(this,null);
	}

	public count(table:string){
		return new CountStatement(this,table);
	}

	public update(table:string){
		return new UpdateStatement(this,table);
	}

	public deleteFrom(table:string){
		return new DeleteStatement(this,table);
	}

	public insertInto(table:string){
		return new InsertStatement(this,table);
	}
}
