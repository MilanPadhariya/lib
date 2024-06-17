import * as fs from 'fs';
import path from 'path';

const templateFilename=path.join(path.dirname(__filename),'./template.ts');
let _template:string[];

function getTemplate(){
	if(!_template)
		_template=fs.readFileSync(templateFilename,'ascii').split('\n');
	return _template.slice();
}

export function fillTemplate(
	defines:Record<string,string|(string[])>
){
	
	let lines=getTemplate();

	const conditions:Record<string,boolean>={
		'true': true,
		'false': false,
	};
	for(let key in defines){
		let value=defines[key];
		key='$'+key;
		if(Array.isArray(value) && value.length===0)
			value=null;
		conditions[key]=!!value;
	}

	for(let i=0;i<lines.length;){
		const line=lines[i];
		if(line.startsWith('//#if ')){
			let begin=i,end=i+1;
			for(;end<lines.length && !lines[end].startsWith('//#end');++end);

			let [,condition]=line.split(' ');
			let not=condition.startsWith('!');
			if(not)
				condition=condition.substring(1);
			let value=conditions[condition];
			if(not)
				value=!value;
			if(value){
				lines.splice(end,1);
				lines.splice(begin,1);
			}else{
				end+=1;
				lines.splice(begin,end-begin);
			}
		}else
			i+=1;
	}

	lines=lines.map(line=>{
		const indent=(line.match(/^\s+/)?.[0] ?? '');
		line=line.replace(/\$(\w+)/g,(found,key)=>{
			let value=defines[key];
			if(value!==undefined){
				if(Array.isArray(value))
					value=value.map((line,i)=>i===0?line:indent+line).join('\n');
				return value.toString();
			}
			return found;
		});
		return line;
	});

	//do a manual replace with the import filename
	for(let i=0;i<2;++i)
		lines[i]=lines[i].replace('./index',defines['libModelMeta'].toString());

	return lines.join('\n');
}
