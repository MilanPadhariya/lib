import ts from 'typescript';

export class ParsingError extends Error{
	public constructor(
		public node:ts.Node,
		message:string,
	){
		super(message);
	}
}
