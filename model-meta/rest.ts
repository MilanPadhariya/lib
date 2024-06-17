import {WhereTable} from "../where";

namespace body{
	export interface Get{
		where:number;
		fields?:string[];
	}

	export interface Put{
		where:number;
		fields:Record<string,any>;
	}

	export interface Post{
		fields:Record<string,any>;
	}
	
	export interface Delete{
		where:number;
	}

	export interface Count{
		where?:WhereTable;
	}

	export interface Search{
		where?:WhereTable;
		fields?:string[];
		range?:[number,number];
		sort?:Record<string,'+'|'-'>;
	}
}

namespace _response{
	export type Get=Record<string,any>;
	export type Search=Record<string,any>[];
}

export interface RestTypes{
	body:{
		Auth:{};
		Get:body.Get;
		Put:body.Put;
		Post:body.Post;
		Delete:body.Delete;
		Count:body.Count;
		Search:body.Search;
	}

	response: {
		Get:_response.Get;
		Search:_response.Search;
	}
}
