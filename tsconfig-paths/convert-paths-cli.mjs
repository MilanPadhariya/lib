import {spawnSync} from 'child_process';
import {tsconfigRead} from '../tsconfig-read.mjs';
import {tsconfigPathsConvert} from './convert-paths.mjs';

const dir=process.argv[2];
const tsconfig=tsconfigRead();
tsconfigPathsConvert(tsconfig,dir);
spawnSync(`node ${dir}/index.js`,{shell:true,stdio:'inherit'});
