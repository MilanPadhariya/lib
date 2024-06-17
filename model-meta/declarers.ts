import { v4 } from 'uuid';

export type char<count extends number>=string;
export type int=number;
export type inet=string;
export type serial=number;
export type table<T>={[name:string]:T};
export type varchar<count extends number>=string;
export type vec2=[number,number];
export type vec3=[number,number,number];
export type uuid=string;

export function uuid(){
	return v4();
}

//none of these do anything
//the magic happens when its parsed by model-meta-builder

export function uniqueKey(target:any, propertyKey:string){}
export function index(target:any, propertyKey:string){}

export const rest={
	secret(target:any, propertyKey:string){},
	readonly(target:any, propertyKey:string){},
	writeonly(target:any, propertyKey:string){},
};
