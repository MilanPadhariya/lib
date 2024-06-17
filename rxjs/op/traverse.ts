import {OperatorFunction, map} from "rxjs";

export function traverse<T,R>(project:(value:T, index:number)=>R):OperatorFunction<T,R>{
	return map((input:T, index:number):R=>{
		if(input===undefined)
			return undefined;
		if(input===null)
			return null;
		return project(input,index);
	});
}
