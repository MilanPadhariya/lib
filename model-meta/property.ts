export type DefaultValue=undefined|string|number|boolean|Date;

interface PropertyBase<Name extends string>{
	name:Name;
	notNull?:true;
	optional?:true;
	comment?:string;
	decorators:Record<string,true>;
	typeLength?:[number,number];
}

export interface PropertyPrimitive<Name extends string=string> extends PropertyBase<Name>{
	type:PropertyPrimitive.Type;
	default?:DefaultValue;
	uniqueKey?:true;
	index?:true;
	foreignKey?:string;
	members?:string[];
}

export namespace PropertyPrimitive{
	export type Type='boolean'|'date'|'enum'|'inet'|'int'|'number'|'serial'|'string'|'timeStep'|'vec2'|'vec3';
	
	const propertyTypeTable:Readonly<{[key in Type]:true}>=Object.freeze({
		boolean: true,
		date: true,
		enum: true,
		int: true,
		inet: true,
		number: true,
		serial: true,//used for id in db,
		string: true,
		timeStep: true,
		vec2: true,
		vec3: true,
	});

	export function typeIs(name:string):name is Type{
		return name in propertyTypeTable;
	}

	export function is<Name extends string>(prop:Property<Name>):prop is PropertyPrimitive<Name>{
		return prop && typeIs(prop.type);
	}
}

export interface PropertyContainer<Name extends string=string> extends PropertyBase<Name>{
	type:PropertyContainer.Type;
	uniqueKey?:undefined;
	value:{
		type:PropertyPrimitive.Type;
		typeLength?:[number,number];
		members?:string[];
	}
	
}

export namespace PropertyContainer{
	export type Type='array'|'table';

	const propertyTypeTable:Readonly<{[key in Type]:true}>=Object.freeze({
		array: true,
		table: true,
	});

	export function typeIs(name:string):name is Type{
		return name in propertyTypeTable;
	}

	export function is<Name extends string>(prop:Property<Name>):prop is PropertyContainer<Name>{
		return prop && typeIs(prop.type);
	}
}

export type Property<Name extends string=string>=PropertyPrimitive<Name>|PropertyContainer<Name>;
export namespace Property{
	export type Type=PropertyPrimitive.Type|PropertyContainer.Type;
}
