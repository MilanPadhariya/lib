import fs from 'fs';
import path from 'path';

export function readDirRecursive(
	dir,
	out=[],
){
	let found=fs.readdirSync(dir,{withFileTypes:true});
	found=found.filter(f=>!f.name.startsWith('.'));
	const subDirs=found.filter(f=>f.isDirectory()).map(f=>path.join(dir,f.name));
	const files=found.filter(f=>f.isFile());
	out.push(...files.map(f=>path.join(dir,f.name)));
	for(const dir of subDirs){
		readDirRecursive(dir,out);
	}
	return out;
}