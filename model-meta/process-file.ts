import * as fs from 'fs';
import ts from 'typescript';
import { MetaData } from './meta-data';
import { parseProperty } from './parse-property';
import { pullComments } from './pull-comment';
import path from 'path';
import { ParsingError } from './parsing-error';

function getStaticProp(sourceFile:ts.SourceFile, staticPropNodes:ts.PropertyDeclaration[], name:string):string{
	const propNode=staticPropNodes.find(n=>n.name.getText(sourceFile)===name);
	if(!propNode)
		return undefined;
	if(!propNode.initializer)
		return undefined;
	if(!ts.isStringLiteral(propNode.initializer))
		return undefined;
	return propNode.initializer.text;
}

export async function processFile(metaData:Record<string,MetaData>, filename:string){
	if(!filename.endsWith('.ts'))
		return;
	
	const contents=await fs.promises.readFile(filename,'ascii');
	const sourceFile=ts.createSourceFile(filename,contents,ts.ScriptTarget.Latest);
	const classNodes=sourceFile
		.getChildren(sourceFile)
		.filter(n=>n.kind===ts.SyntaxKind.SyntaxList)
		.flatMap(node=>node.getChildren(sourceFile).filter(ts.isClassDeclaration));

	try{
		for(const classNode of classNodes){
			const decorators=(ts.getDecorators(classNode) || []).map(n=>n.getText(sourceFile).substring(1));
			let propNodes=classNode.members.filter(ts.isPropertyDeclaration);
			const className=classNode.name.text;

			if(className){
				const staticPropNodes=propNodes.filter(n=>n.name && n.modifiers?.find(n=>n.kind===ts.SyntaxKind.StaticKeyword) && !n.modifiers?.find(n=>n.kind===ts.SyntaxKind.PrivateKeyword));
				propNodes=propNodes.filter(n=>n.name && !n.modifiers?.find(n=>n.kind===ts.SyntaxKind.StaticKeyword) && !n.modifiers?.find(n=>n.kind===ts.SyntaxKind.PrivateKeyword));
				const route=getStaticProp(sourceFile,staticPropNodes,'route') ?? null;
				const comments=pullComments(sourceFile,classNode);
				const properties=propNodes
					.map(node=>parseProperty(sourceFile,node))
					.filter(v=>!!v);
				filename=path.resolve(filename);
				metaData[className]={
					className,
					decorators,
					properties,
					comments,
					filename,
					route,
				};
			}
		}
	}catch(e){
		if(e instanceof ParsingError){
			const start=e.node.getStart(sourceFile);
			const pos=sourceFile.getLineAndCharacterOfPosition(start);
			if(pos)
				pos.line+=1;
			console.error(e.message,'\n',`in file (${filename}:${pos?.line}:${pos?.character})`);
		}else
			throw e;
	}
}
