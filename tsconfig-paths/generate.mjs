import fs from 'fs';
import path from 'path';
import {readDirRecursive} from './read-dir-recursive.mjs';

export function tsconfigPathsGenerate(
	tsconfig,
){
	const projDir=''+tsconfig.options['pathsBasePath'];

	const paths=tsconfig.options.paths ?? {};
	for(const key in paths)
		paths[key]=paths[key].map(value=>path.join(projDir,value));

	const extension='.ts';
	const pathMap={};
	for(let [alias,resolutions] of Object.entries(paths)){
		if(alias.endsWith('/*')){
			alias=alias.substring(0,alias.length-2);
			resolutions=resolutions.filter(v=>v.endsWith('*')).map(v=>v.substring(0,v.length-2));
			for(const dir of resolutions){
				let files=readDirRecursive(dir);
				files=files.filter(fn=>fn.endsWith(extension));
				files=files.map(fn=>fn.substring(0,fn.length-3));
				files=[...new Set(files)];
				for(const val of files){
					let key=path.join(alias,val.substring(dir.length));
					key=key.replace(/\\/g,'/');
					pathMap[key]=val;
					if(val.endsWith(path.sep+'index')){
						key=key.substring(0,key.length-6);
						pathMap[key]=val;
					}
				}
			}
		}else{
			let filePath=resolutions.find(p=>fs.existsSync(p) || fs.existsSync(p+extension) || fs.existsSync(path.join(p,'index'+extension)));
			if(filePath!==undefined)
				pathMap[alias]=filePath;
		}
	}

	for(let [key,val] of Object.entries(pathMap)){
		val=path.relative(projDir,val);
		val=val.replace(/\\/g,'/');
		pathMap[key]=val;
	}
	return pathMap;
}
