import {ModelMeta} from "../model-meta";

interface InstanceBase{
	id:number;
	fromResponse?(r:Response):void;
}

export class Response{
	public constructor(
		public readonly value:any,
	){
	}

	public errors:string[];

	public isNull(){
		if(this.errors)
			return false;
		return this.value===null;
	}

	public asString(){
		if(this.errors)
			return null;
		if(!this.value)
			return null;
		if(typeof(this.value)==='string'){
			return this.value;
		}
		return null;
	}	

	public to<Instance extends InstanceBase>(Type:{
		meta:ModelMeta;
		new ():Instance;
	}):Instance{
		if(this.errors)
			return null;
		if(this.value && typeof(this.value)==='object' && this.value.id){
			const instance=Response.getInstance(Type,this.value.id);
			if(instance.fromResponse)
				instance.fromResponse(this);
			else
				Type.meta.copyToInstance(this.value,instance);
			return instance;
		}
		this.errors=['response invalid'];
		return null;
	}

	public toArray<Instance extends {}>(Type:{
		meta:ModelMeta;
		new ():Instance;
	}):Instance[]{
		if(this.errors)
			return null;
		if(Array.isArray(this.value)){
			if(this.value.every(item=>typeof(item)==='object' && item.id)){
				return this.value.map(item=>{
					const instance=Response.getInstance(Type,item.id);
					Type.meta.copyToInstance(item,instance);
					return instance;
				});
			}
		}
		this.errors=['response invalid'];
		return null;
	}

	public toBool(){
		if(this.errors)
			return null;
		if(this.value===true)
			return true;
		if(this.value===false)
			return true;
		this.errors=['response invalid'];
		return null;
	}

	public toInt(){
		if(this.errors)
			return null;
		if(typeof(this.value)==='number'){
			if(this.value===Math.floor(this.value)){
				return this.value;
			}
		}
		this.errors=['response invalid'];
		return null;
	}

	public toString(){
		if(this.errors)
			return null;
		if(typeof(this.value)==='string'){
			return this.value;
		}
		if(!this.value)
			return null;
		this.errors=['response invalid'];
		return null;
	}

	public toStrings(){
		if(this.errors)
			return null;
		if(Array.isArray(this.value)){
			if(this.value.every(item=>typeof(item)==='string')){
				return <string[]>this.value;
			}
		}
		this.errors=['response invalid'];
		return null;
	}

	public toRecord<T extends {}=Record<string,number|string|boolean>>(){
		if(this.errors)
			return null;
		if(typeof(this.value)==='object'){
			return <T>this.value;
		}
		this.errors=['response invalid'];
		return null;
	}

	public toRecords<T extends {}=Record<string,number|string|boolean>>(){
		if(this.errors)
			return null;
		if(Array.isArray(this.value)){
			if(this.value.every(item=>typeof(item)==='object')){
				return <T[]>this.value;
			}
		}
		this.errors=['response invalid'];
		return null;
	}

	public found(){
		return !this.errors?.includes('not found');
	}

	public connected(){
		if(this.errors?.includes('not sent'))
			return undefined;
		return !this.errors?.includes('could not connect to server');
	}

	public field(key:string){
		const r=new Response(this.value[key]);
		return r;
	}
}

export namespace Response{
	export function error(errors:string[]){
		const r=new Response(null);
		r.errors=errors;
		return r;
	}

	const instanceCaches=new WeakMap<{},Map<number,WeakRef<{}>>>();
	export function getInstance<Instance extends {}>(
		Type:{
			meta:ModelMeta;
			new ():Instance;
		},
		id:number
	):Instance{
		let cache=instanceCaches.get(Type);
		if(!cache)
			instanceCaches.set(Type,cache=new Map());
		let instance=<Instance>cache.get(id)?.deref();
		if(!instance)
			cache.set(id,new WeakRef(instance=new Type()));
		return instance;
	}
	
}
