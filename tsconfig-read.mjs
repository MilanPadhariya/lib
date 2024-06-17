import fs from 'fs';
import path from 'path';
import ts from 'typescript';

export function tsconfigRead(){
	const tsconfigFilename=path.resolve('./tsconfig.json');
	const sourceFile=ts.readJsonConfigFile(tsconfigFilename,filename=>fs.readFileSync(filename,'ascii'));
	const out=ts.parseJsonSourceFileConfigFileContent(sourceFile,ts.sys,process.cwd());
	out.options.rootDir??=process.cwd();
	return out;
}
