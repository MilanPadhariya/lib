import path from 'path';
import {tsconfigRead} from "../tsconfig-read";
import {tsconfigPathsGenerate} from "./generate";
import {tsconfigPathsRegister} from "./register";

const tsconfig=tsconfigRead();
const pathMap=tsconfigPathsGenerate(tsconfig);
for(const [k,v] of Object.entries(pathMap))
	pathMap[k]=path.resolve(v);
tsconfigPathsRegister(pathMap);
