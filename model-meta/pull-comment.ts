import ts from 'typescript';

export function pullComments(sourceFile:ts.SourceFile, node:ts.Node){
	const nodeText=node.getFullText(sourceFile);
	const commentRanges=ts.getLeadingCommentRanges(nodeText,0);
	if(commentRanges && commentRanges.length>0){
		const comments=commentRanges
			.map(range=>{
				let value=nodeText.substring(range.pos,range.end);
				if(value.startsWith('//')){
					value=value.substring(2).trimStart();
				}else if(value.startsWith('/*')){
					value=value.replace(/^\/\*+\s*/,'');
					value=value.replace(/\s*\*+\//,'');
					value=value.replace(/\s*\*\s*/,'\n');
					value=value.trim();
				}
				return value;
			});
			return comments;
	}
	return [];
}