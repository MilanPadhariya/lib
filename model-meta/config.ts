import * as fs from 'fs';
import path from 'path';
import {PropertyPrimitive} from './property';

export interface Config{
	inputDir:string;
	outputDir:string;
	includeSecrets:boolean;
	rest?:{
		authorizationFields: {
			name:string;
			type:PropertyPrimitive.Type;
		}[];
	}
}

export function readConfigs(configFilename:string){
	console.info('configFilename',configFilename);
	if(path.extname(configFilename)!=='.json'){
		console.error('config file must be json');
		process.exitCode=1;
		process.exit();
	}

	configFilename=path.resolve(configFilename);
	const configDir=path.dirname(configFilename);
	const contents=fs.readFileSync(configFilename,{encoding:'ascii'});
	const configs=<Config[]>JSON.parse(contents);
	for(const config of configs){
		config.inputDir=path.join(configDir,config.inputDir);
		config.outputDir=path.join(configDir,config.outputDir);
		config.includeSecrets??=true;
	}

	return configs;
}
