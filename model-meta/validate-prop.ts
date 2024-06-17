import {DateTime} from '../date-time';
import {PropertyContainer, PropertyPrimitive, Property} from './property';

export function validateProp(
	prop:Property,
	value:any,
	errorFn:(error:string)=>void,
){
	if(checkNull(prop,value,errorFn))
		return;
	validateProp.type[prop.type](<any>prop,value,errorFn);
}

export function validatePropPrimitive(
	prop:{
		type:PropertyPrimitive.Type
		notNull?:boolean,
		typeLength?:[number,number],
	},
	value:any,
	errorFn:(error:string)=>void,
){
	if(checkNull(prop,value,errorFn))
		return;
	validateProp.type[prop.type](<any>prop,value,errorFn);
}

function checkNull(prop:{notNull?:boolean}, value:any, errorFn:(error:string)=>void){
	if(value===null || value===undefined){
		if(prop.notNull)
			errorFn(`type is null, expected not null`);
		return true;
	}
	return false;
}

export namespace validateProp{
	interface PropTypeByType{
		array:PropertyContainer;
		boolean:PropertyPrimitive;
		date:PropertyPrimitive;
		enum:PropertyPrimitive;
		int:PropertyPrimitive;
		inet:PropertyPrimitive;
		number:PropertyPrimitive;
		serial:PropertyPrimitive;
		string:PropertyPrimitive;
		table:PropertyContainer;
		timeStep:PropertyPrimitive;
		vec2:PropertyPrimitive;
		vec3:PropertyPrimitive;
	}
	
	type ValidatePropPrimitiveType={
		[key in PropertyPrimitive.Type]:((prop:{
			type:PropertyPrimitive.Type;
			notNull?:boolean;
			typeLength?:[number,number];
			members?:string[];
		},value:any,errorFn:(error:string)=>void)=>void);
	}

	export const primitiveType:ValidatePropPrimitiveType={
		boolean: (prop, value, errorFn)=>{
			if(typeof(value)!=='boolean')
				errorFn(`type is ${typeof(value)}, expected boolean`);
		},
		date: (prop, value, errorFn)=>{
			if(!(value instanceof Date && !isNaN(value.getTime())))
				errorFn(`type is ${typeof(value)}, expected date`);
		},
		enum: (prop, value, errorFn)=>{
			if(value===null && !prop.notNull)
				return;
			if(!prop.members.includes(value))
				errorFn(`type is ${typeof(value)}, expected ${prop.members.map(v=>`'${v}'`).join('|')}`);
		},
		int: (prop, value, errorFn)=>{
			if(value===null){
				if(prop.notNull)
					errorFn(`type is null, expected not null`);
				return;
			}
			if(typeof(value)!=='number')
				errorFn(`type is ${typeof(value)}, expected int`);
			else if(Math.floor(value)!==value)
				errorFn(`contains fractional value, expected int`);
		},
		inet: (prop, value, errorFn)=>{
			if(typeof(value)!=='string')
				errorFn(`type is ${typeof(value)}, expected ip address`);
			else if(!value.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/))
				errorFn(`does no match ip address format`);
		},
		number: (prop, value, errorFn)=>{
			if(typeof(value)!=='number')
				errorFn(`type is ${typeof(value)}, expected number`);
			else if(isNaN(value))
				errorFn(`type is ${typeof(value)}, got NaN`);
		},
		serial: (prop, value, errorFn)=>{
			if(typeof(value)!=='number')
				errorFn(`type is ${typeof(value)}, expected int`);
			else if(Math.floor(value)!==value)
				errorFn(`contains fractional value, expected int`);
		},
		string: (prop, value, errorFn)=>{
			if(value===null && !prop.notNull)
				return;
			if(typeof(value)!=='string'){
				errorFn(`type is ${typeof(value)}, expected string`);
			}else if(prop.typeLength){
				if(prop.typeLength[0]===prop.typeLength[1]){
					if(value.length!==prop.typeLength[0])
						errorFn(`length must be ${prop.typeLength[0]}, got ${value.length}`);
				}else{
					if(value.length<prop.typeLength[0] || prop.typeLength[1]<value.length)
						errorFn(`length must be in range [${prop.typeLength[0]},${prop.typeLength[1]}], got ${value.length}`);
				}
			}
		},
		timeStep: (prop, value, errorFn)=>{
			if(!(
				Array.isArray(value)
				&& value.length===2
				&& typeof(value[0])==='number'
				&& DateTime.StepUnit.is(value[1])
			)){
				errorFn(`format incorrect, got ${JSON.stringify(value)}expected [number,'<unit>']`);
			}
		},
		vec2: (prop, value, errorFn)=>{
			if(!Array.isArray(value))
				errorFn(`type is ${typeof(value)}, expected [number,number]`);
			else if(value.length!==2)
				errorFn(`has length ${value.length}, expected [number,number]`);
			else if(value.every(v=>typeof(v)==='number'))
				errorFn(`type is [${value.map(v=>typeof(v)).join(',')}], expected [number,number]`);
		},
		vec3: (prop, value, errorFn)=>{
			if(!Array.isArray(value))
				errorFn(`type is ${typeof(value)}, expected [number,number]`);
			else if(value.length!==3)
				errorFn(`has length ${value.length}, expected [number,number]`);
			else if(value.every(v=>typeof(v)==='number'))
				errorFn(`type is [${value.map(v=>typeof(v)).join(',')}], expected [number,number]`);
		},
	};

	type ValidatePropType={
		[key in Property.Type]:((prop:PropTypeByType[key],value:any,errorFn:(error:string)=>void)=>void);
	}
	
	export const type:ValidatePropType={
		...primitiveType,
		array: (prop, value, errorFn)=>{
			if(!Array.isArray(value)){
				errorFn(`type is ${typeof(value)}, expected array`);
			}else{
				if(prop.typeLength){
					if(prop.typeLength[0]===prop.typeLength[1]){
						if(value.length!==prop.typeLength[0])
							errorFn(`length must be ${prop.typeLength[0]}, got ${value.length}`);
					}else{
						if(value.length<prop.typeLength[0] || prop.typeLength[1]<value.length)
							errorFn(`length must be in range [${prop.typeLength[0]},${prop.typeLength[1]}], got ${value.length}`);
					}
				}

				for(const [i,v] of value.entries())
					validatePropPrimitive(prop.value,v,e=>errorFn(`${e} at [${i}]`));
			}
		},
		table: (prop, value, errorFn)=>{
			if(typeof(value)!=='object')
				errorFn(`type is ${typeof(value)}, expected table`);
		},
	};
}
