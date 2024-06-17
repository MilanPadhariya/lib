import {validateWhereTable as _validateWhereTable} from "../where";
import {Property,Property as _Property,PropertyPrimitive} from "./property";
import {PropertyList,PropertyList as _PropertyList} from "./property-list";
import {validateProp} from "./validate-prop";
import {DateTime} from "../date-time";

export class ModelMeta<
	PropName extends string=string
> extends PropertyList<Property<PropName>>{
	public constructor(
		public readonly name:string,
		public readonly comments:string[],
		props:Property<PropName>[],
	){
		super(props);
	}

	public readonly primitives=new PropertyList(this.array.filter(PropertyPrimitive.is));
	public readonly secrets=new PropertyList(this.array.filter(prop=>prop.decorators['rest.secret']));

	public rest:{
		route:string;
		authorization:PropertyList<PropertyPrimitive<string>>,
		get: ModelMeta.Rest.body.Get,
		put: ModelMeta.Rest.body.Put,
		post: ModelMeta.Rest.body.Post,
		delete: ModelMeta.Rest.body.Delete,
		count: ModelMeta.Rest.body.Count,
		search: ModelMeta.Rest.body.Search,
	};

	public generateRest(
		route:string,
		authorizationProps:PropertyPrimitive[],
	){
		const authorization=new PropertyList(authorizationProps);
		const props=this.array.filter(prop=>!prop.decorators['rest.secret']);
		// const primitives=new PropertyList(props.filter(PropertyPrimitive.is));
		const readable=props.filter(prop=>!prop.decorators['rest.writeonly']);
		const readablePrimitives=new PropertyList(readable.filter(PropertyPrimitive.is));
		const writable=new PropertyList<Property<PropName>>(props.filter(prop=>!prop.decorators['rest.readonly'] && prop.type!=='serial'));
		// const uniqueKeyWhere=new PropertyList(<PropertyPrimitive<PropName>[]>props.filter(prop=>prop.uniqueKey));

		this.rest={
			route,
			authorization,
			get: new ModelMeta.Rest.body.Get(new Set([...readable].map(prop=>prop.name))),
			put: new ModelMeta.Rest.body.Put(writable),
			post: new ModelMeta.Rest.body.Post(writable),
			delete: new ModelMeta.Rest.body.Delete(),
			count: new ModelMeta.Rest.body.Count(readablePrimitives),
			search: new ModelMeta.Rest.body.Search(readablePrimitives),
		}
	}

	public copyToInstance(src:Record<string,any>, dest:Record<string,any>){
		for(const prop of this){
			let value=src[prop.name];
			if(prop.type==='date' && typeof(value)==='string')
				value=new DateTime(value);
			dest[prop.name]=value;
		}
	}

	public removeSecrets<T extends Record<string,any>>(obj:T){
		for(const prop of this.secrets)
			delete obj[prop.name];
		return obj;
	}

	public validate(
		value:unknown,
		exceptionType:{new (errors:string[]):any},
		cleanNumbers:boolean,
		cleanDates:boolean,
	){
		const errors:string[]=[];
		const obj=validateIsObject(errors,value,false);
		if(obj){
			const propsRemaining=new Set(this.array.filter(prop=>!prop.optional));
			for(let [field,value] of Object.entries(obj)){
				const prop=this.get(<PropName>field);
				if(!prop){
					errors.push(`${JSON.stringify(field)} unknown field`);
				}else{
					propsRemaining.delete(prop);
					if(cleanNumbers){
						if((prop.type==='number' || prop.type==='int' || prop.type==='serial') && typeof(value)==='string'){
							value=+value;
							(<any>obj)[field]=value;
						}else if(prop.type==='array' && prop.value.type==='number'){
							if(Array.isArray(value)){
								for(let i=0;i<value.length;++i)
									value[i]=+value[i];
							}
						}else if(prop.type==='timeStep'){
							if(Array.isArray(value))
								value[0]=+value[0];
						}
					}
					if(cleanDates){
						if(prop.type==='date' && typeof(value)==='string'){
							value=new DateTime(value);
							(<any>obj)[field]=value;
						}
					}
					validateProp(prop,value,e=>errors.push(`in field '${field}' ${e}`));
				}
			}
			for(const prop of propsRemaining){
				errors.push(`missing field '${prop.name}'`);
			}
		}
		if(errors.length>0)
			throw new exceptionType(errors);
		return obj;
	}
}

function quote(field:string){
	field=field.replace("'","\\'");
	field=`'${field}'`;
	return field;
}

function validateIsObject(errors:string[], obj:unknown, dupObj:boolean){
	if(!(typeof(obj)==='object' && obj)){
		errors.push('not an object');
		return null;
	}
	if(dupObj)
		obj={...obj};
	return <{[k in string]:any}>obj;
}

function validateIdWhere(errors:string[], obj:{where?:any}, convertString:boolean){
	if(!('where' in obj)){
		errors.push("missing 'where'");
	}else{
		if(convertString && typeof(obj.where)==='string' && !isNaN(+obj.where))
			obj.where=+obj.where;
		if(typeof(obj.where)!=="number")
			errors.push("'where' is not a number "+typeof(obj.where));
		else if(obj.where!==Math.floor(obj.where))
			errors.push("'where' is not an integer");
		delete obj.where;
	}
}

function validateEmpty(errors:string[], obj:{}){
	for(const field of Object.keys(obj))
		errors.push(`${quote(field)} unknown field`);
}

function validateFields(
	errors:string[],
	obj:{
		fields?:Record<string,any>
	},
	props:PropertyList<Property>
){
	if('fields' in obj){
		let fields=obj.fields;
		if(typeof(fields)!=='object'){
			errors.push("'fields' is not an object");
		}else{
			for(const [field,value] of Object.entries(fields)){
				const prop=props.get(field);
				if(!prop)
					errors.push(`${quote(field)} unknown field`);
				else
					validateProp(prop,value,e=>errors.push(`in field '${field}' ${e}`));
			}
		}
		delete obj.fields;
	}
}

function validateWhereTable(
	errors:string[],
	obj:{where?:unknown},
	validCols:string[],
){
	try{
		_validateWhereTable(obj.where,validCols);
	}catch(e){
		if(e instanceof Error)
			errors.push('in where: '+e.message);
		else
			errors.push('in where: unknown');
	}
	delete obj.where;	
}

function validateRange(
	errors:string[],
	obj:{range?:[number,number]},
){
	if(obj.range){
		if(!(Array.isArray(obj.range) && obj.range.length===2)){
			errors.push('range invalid');
		}else{
			if(!(typeof(obj.range[0])==='number' && obj.range[0]===Math.floor(obj.range[0])))
				errors.push('range offset invalid');
			if(!(typeof(obj.range[1])==='number' && obj.range[1]===Math.floor(obj.range[1])))
				errors.push('range length invalid');
		}
		delete obj.range;
	}
}

function validateSort(
	errors:string[],
	obj:{sort?:Record<string,'+'|'-'>},
	props:PropertyList<Property>,
){
	if('sort' in obj){
		let sort=obj.sort;
		if(typeof(sort)!=='object'){
			errors.push("'sort' is not an object");
		}else{
			for(const [field,dir] of Object.entries(sort)){
				const prop=props.get(field);
				if(!prop){
					errors.push(`${quote(field)} unknown sort field`);
				}else{
					if(dir!=='+' && dir!=='-')
						errors.push(`in sort ${quote(field)} has invalid direction`);
				}
			}
		}
		delete obj.sort;
	}
}

export namespace ModelMeta{
	export import Property=_Property;
	export type PropertyList<Prop extends Property>=_PropertyList<Prop>;

	export namespace Rest{
		export namespace body{
			export class Get{
				public constructor(
					public fields:Set<string>,
				){
				}

				public validate(value:unknown){
					const errors:string[]=[];
					const obj=validateIsObject(errors,value,true);
					if(!obj)
						return errors;

					validateIdWhere(errors,obj,true);
					
					if('fields' in obj){
						let fields=obj['fields'];
						if(!Array.isArray(fields)){
							errors.push("'fields' is not an array");
						}else{
							for(const field of fields){
								if(!this.fields.has(field))
									errors.push(`${quote(field)} unknown field`);
							}
						}
						delete obj['fields'];
					}
					validateEmpty(errors,obj);
					return errors;
				}
			}

			export class Put{
				public constructor(
					public fields:PropertyList<Property>,
				){
				}

				public validate(value:unknown){
					const errors:string[]=[];
					const obj=validateIsObject(errors,value,true);
					if(!obj)
						return errors;

					validateIdWhere(errors,obj,false);
					validateFields(errors,obj,this.fields);
					validateEmpty(errors,obj);
					return errors;
				}
			}

			export class Post{
				public constructor(
					public fields:PropertyList<Property>,
				){
				}

				public validate(value:unknown){
					const errors:string[]=[];
					const obj=validateIsObject(errors,value,true);
					if(!obj)
						return errors;

					validateFields(errors,obj,this.fields);
					validateEmpty(errors,obj);
					return errors;
				}
			}

			export class Delete{
				public validate(value:unknown){
					const errors:string[]=[];
					const obj=validateIsObject(errors,value,true);
					if(!obj)
						return errors;

					validateIdWhere(errors,obj,false);
					validateEmpty(errors,obj);
					return errors;
				}
			}

			export class Count{
				public constructor(
					public where:PropertyList<PropertyPrimitive>,
				){
				}

				public validate(value:unknown){
					const errors:string[]=[];
					const obj=validateIsObject(errors,value,true);
					if(!obj)
						return errors;

					validateWhereTable(errors,obj,this.where.names());
					validateEmpty(errors,obj);
					return errors;
				}
			}

			export class Search{
				public constructor(
					public where:PropertyList<PropertyPrimitive>,
				){
				}

				public validate(value:unknown){
					const errors:string[]=[];
					const obj=validateIsObject(errors,value,true);
					if(!obj)
						return errors;

					validateWhereTable(errors,obj,this.where.names());
					validateRange(errors,obj);
					validateSort(errors,obj,this.where);
					validateEmpty(errors,obj);
					return errors;
				}
			}
		}
	}
}