import ts from 'typescript';
import {ParsingError} from './parsing-error';
import {Property,PropertyPrimitive} from './property';
import {pullComments} from './pull-comment';

function parsePrimitiveType(sourceFile:ts.SourceFile, node:ts.TypeNode):{
	type:PropertyPrimitive.Type;
	typeLength?:[number,number];
	foreignKey?:string;
	members?:string[];
}{
	if(ts.isIndexedAccessTypeNode(node) && ts.isTypeReferenceNode(node.objectType) && ts.isLiteralTypeNode(node.indexType) && ts.isStringLiteral(node.indexType.literal) && node.indexType.literal.text==='id'){
		const foreignKey=node.objectType.typeName.getText(sourceFile);
		return {type:'int',foreignKey};
	}else if(ts.isTypeReferenceNode(node)){
		let type=node.typeName?.getText(sourceFile);
		if(type==='char' || type==='varchar'){
			if(node.typeArguments?.length!==1)
				throw new ParsingError(node,'unreconized type');
			if(node.typeArguments[0].kind!==ts.SyntaxKind.LiteralType)
				throw new ParsingError(node,'unreconized type');
			const literalNode=<ts.LiteralTypeNode>node.typeArguments[0];
			if(literalNode.literal.kind!==ts.SyntaxKind.NumericLiteral)
				throw new ParsingError(node,'unreconized type');
			const count=parseInt((<ts.NumericLiteral>literalNode.literal).getText(sourceFile));
			if(type==='char')
				return {type: 'string',typeLength:[count,count]};
			return {type: 'string',typeLength:[0,count]};
		}else if(type==='uuid'){
			return {type:'string',typeLength:[36,36]};
		}else if(type==='Date' || type==='DateTime'){
			return {type:'date'};
		}else if(type==='DateTime.Step'){
			return {type:'timeStep'};
		}
	}else if(ts.isUnionTypeNode(node)){
		const members=parseUnionType(node);
		if(members)
			return {type:'enum',members};
	}
	let type=node.getText(sourceFile);
	if(PropertyPrimitive.typeIs(type))
		return {type};
	throw new ParsingError(node,'unreconized type');
}

function parseUnionType(unionNode:ts.UnionTypeNode){
	const members:string[]=[];
	for(const node of unionNode.types){
		if(!ts.isLiteralTypeNode(node))
			return null;
		const {literal}=node;
		if(!ts.isStringLiteral(literal))
			return null;
			members.push(literal.text);
	}
	return members;
}

function parseDefaultValue(out:PropertyPrimitive, sourceFile:ts.SourceFile, node:ts.Expression){
	if(node){
		if(node.kind===ts.SyntaxKind.TrueKeyword){
			out.default=true;
			out.type??='boolean';
		}else if(node.kind===ts.SyntaxKind.FalseKeyword){
			out.default=false;
			out.type??='boolean';
		}else if(node.kind===ts.SyntaxKind.NullKeyword){
			out.default=null;
		}else if(ts.isNumericLiteral(node)){
			const value=node.getText(sourceFile);
			if(value.match(/^\d+$/)){
				out.default=parseInt(value);
				out.type??='int';
			}else{
				out.default=parseInt(value);
				out.type??='number';
			}
		}else if(ts.isStringLiteral(node)){
			//out.default=node.getText(sourceFile);
			out.default=node.text;
			out.type??='string'
		}else if(ts.isCallExpression(node) && node.getText(sourceFile)==='uuid()'){
			out.default='uuid()';
			out.type='string';
			out.typeLength=[36,36];
			out.uniqueKey=true;
		}else if(ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.getText(sourceFile)==='DateTime'){
			out.default='now()';
			out.type='date';
		}else
			throw new ParsingError(node,'unreconized default value');
	}
}

export function parseProperty(sourceFile:ts.SourceFile, node:ts.PropertyDeclaration):Property{
	const name=node.name.getText(sourceFile);
	let prop:Property;

	const decorators=((node && ts.getDecorators(node)) ?? []).map(n=>n.getText(sourceFile).substring(1));
	const typeNode=node.type;

	if(typeNode && ts.isArrayTypeNode(typeNode)){
		const valueType=parsePrimitiveType(sourceFile,typeNode.elementType);
		prop={
			name,
			type: 'array',
			decorators: Object.fromEntries(decorators.map(key=>[key,true])),
			value: valueType,
		};
	}else if(typeNode && ts.isTupleTypeNode(typeNode)){
		const valueType=parsePrimitiveType(sourceFile,typeNode.elements[0])
		prop={
			name,
			type: 'array',
			decorators: Object.fromEntries(decorators.map(key=>[key,true])),
			typeLength: [2,2],
			value: {
				type: valueType.type,
				typeLength: valueType.typeLength,
			},
		};
	}else if(typeNode && ts.isTypeReferenceNode(typeNode) && typeNode.getText(sourceFile)==='table'){
		if(typeNode.typeArguments?.length!==1)
			throw new ParsingError(node,'unreconized type');
		const arg=typeNode.typeArguments[0];
		if(!ts.isTypeReferenceNode(arg))
			throw new ParsingError(node,'unreconized type');
		const valueType=parsePrimitiveType(sourceFile,arg);
		prop={
			name,
			type: 'table',
			decorators: Object.fromEntries(decorators.map(key=>[key,true])),
			value: valueType,
		};
	}else{
		if(typeNode){
			prop={
				name,
				...parsePrimitiveType(sourceFile,typeNode),
				decorators: Object.fromEntries(decorators.map(key=>[key,true])),
			};
		}else{
			prop={
				name,
				type: undefined,
				decorators: Object.fromEntries(decorators.map(key=>[key,true])),
			};
		}
		if(prop.type==='serial' || decorators.includes('uniqueKey'))
			prop.uniqueKey=true;
		parseDefaultValue(prop,sourceFile,node.initializer);
		if(prop.default!==undefined)
			prop.optional=true;
		if(!prop.type)
			throw new ParsingError(node,'no type, explicit or infered');

		if(prop.uniqueKey && prop.default!==undefined && prop.default!==null && prop.default!=='uuid()'){
			throw new ParsingError(node,'can not be @uniqueKey and have a default value (besides null and uuid())');
		}
		if(decorators.includes('index')){
			if(prop.uniqueKey)
				throw new ParsingError(node,'can not be @uniqueKey and @index');
			prop.index=true;
		}
		if(prop.default!==null)
			prop.notNull=true;
	}

	if(node.questionToken)
		prop.optional=true;

	prop.comment=pullComments(sourceFile,node).at(-1);
	return prop;
}