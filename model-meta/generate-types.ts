import {Property, PropertyPrimitive} from './property';

function _getTsType(
	prop:{
		type:PropertyPrimitive.Type;
		typeLength?:[number,number];
		members?:string[];
	}
){
	const {type}=prop;
	let out:string=type;
	if(type==='serial')
		out='number';
	else if(type==='int')
		out='number';
	else if(type==='date')
		out='DateTime';
	else if(type==='enum')
		out=prop.members.map(v=>`'${v}'`).join('|');
	else if(type==='inet')
		out='string';
	else if(type==='timeStep')
		out='DateTime.Step';
	return out;
}

function getTsType(prop:Property){
	let out:string;
	if(prop.type==='array'){
		const type=_getTsType(prop.value);
		if(prop.typeLength && prop.typeLength[0]===prop.typeLength[1]){
			const count=prop.typeLength[0]
			let a:string[]=[];
			for(let i=0;i<count;++i)
				a.push(type);
			out=`[${a.join(',')}]`;
		}else{
			out=`${type}[]`;
		}
	}else if(PropertyPrimitive.is(prop)){
		out=_getTsType(prop);
	}else
		throw new Error('can not convert to ts');
	return out;
}

export function generateTypesFromProps(props:Property[]){
	if(props.length===0)
		return [];

	return props
		.map((prop,i)=>{
			let optional:''|'?'='';
			if(prop.optional || 'default' in prop)
				optional='?';
			return `${prop.name}${optional}:${getTsType(prop)};`
		});
}

export function generateClassTypesFromProps(props:Property[]){
	if(props.length===0)
		return [];

	return props
		.map((prop)=>{
			let optional:''|'?'='';
			if(prop.optional)
				optional='?';
			let _default='';
			if('default' in prop){
				optional='';
				if(prop.default==='now()')
					_default='=new DateTime()';
				else if(prop.default==='uuid()')
					_default='=uuid()';
				else if(prop.type==='string')
					_default='='+JSON.stringify(prop.default);
				else
					_default='='+prop.default;
			}
			return `public ${prop.name}${optional}:${getTsType(prop)}${_default};`
		});
}
