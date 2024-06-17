import {Property} from './property';

export interface MetaData{
	className:string;
	decorators:string[];
	properties:Property[];
	comments:string[];
	filename:string;
	route:string;
}
