import fs from 'fs';
import path from 'path';
import {tsconfigPathsGenerate} from './generate.mjs';
import {readDirRecursive} from './read-dir-recursive.mjs';

export function tsconfigPathsConvert(
	tsconfig,
	dir,
){
	const pathMap=tsconfigPathsGenerate(tsconfig);
	for(let [key,val] of Object.entries(pathMap)){
		val=path.join(dir,val);
		val=val.replace(/\\/g,'/');
		pathMap[key]=val;
	}
	const files=readDirRecursive(dir).filter(fn=>fn.endsWith('.js'));
	for(const fn of files){
		let contents=fs.readFileSync(fn,'ascii');
		const fileDir=path.dirname(fn);
		contents=contents.replace(/require\("([^"\n;]+)"\)/g,(_,require)=>{
			if(pathMap[require]){
				require=path.relative(fileDir,pathMap[require]);
				require=require.replaceAll('\\','/');
				if(!(require.startsWith('../') || require.startsWith('./')))
					require='./'+require;
			}
			return `require("${require}")`;
		});
		fs.writeFileSync(fn,contents);
	}
}
