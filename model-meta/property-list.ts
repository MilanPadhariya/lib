import {Property} from "./property";

export class PropertyList<Prop extends Property>{
	public constructor(
		protected readonly array:Prop[]
	){
	}

	private readonly _map=new Map(this.array.map(prop=>[prop.name,prop]));

	public clone(){
		return new PropertyList<Prop>(this.array.map(prop=>({...prop})));
	}

	public get(name:Prop['name']){
		return this._map.get(name);
	}

	public [Symbol.iterator](){
		return this.array.values();
	}

	public names(){
		return this.array.map(prop=>prop.name);
	}

	public copyFields(src:Record<string,any>, dest:Record<string,any>, exclude?:Prop['name'][]){
		for(const prop of this){
			if(exclude?.includes(prop.name))
				continue;
			let value=src[prop.name];
			dest[prop.name]=value;
		}
		return dest;
	}

	public areFieldsEqual(a:Record<string,any>, b:Record<string,any>, exclude?:Prop['name'][]){
		for(const prop of this){
			if(exclude?.includes(prop.name))
				continue;
			if(a[prop.name]!==b[prop.name])
				return false;
		}
		return true;
	}
}
