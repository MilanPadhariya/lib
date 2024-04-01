import {default as module} from 'module';

export function tsconfigPathsRegister(pathMap:Record<string,string>){
	const originalResolveFilename=(<any>module)._resolveFilename;
	(<any>module)._resolveFilename=function(...args:any[]):string{
		const request:string=args[0];
		let match=pathMap[request];
		if(match){
			args[0]=match;
		}else{
			// if(request.startsWith('.')){
			// 	let fullpath=path.join(module.path,request);
			// 	if(fs.existsSync(fullpath+'.'+extension)){
			// 		fullpath+='.'+extension;
			// 	}else if(fs.existsSync(path.join(fullpath,'index.'+extension)))
			// 		fullpath=path.join(fullpath,'index.'+extension);
			// 	let relativePath=path.relative(module.path,fullpath);
			// 	if(!relativePath.startsWith('.'))
			// 		relativePath='./'+relativePath;
			// 	args[0]=relativePath;
			// }
		}
	
		return originalResolveFilename.apply(this,args);
	};
}
