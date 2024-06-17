import * as fs from 'fs';
import path from 'path';
import {CliArgs} from '../cli-args';
import {generateClassTypesFromProps, generateTypesFromProps} from './generate-types';
import {MetaData} from './meta-data';
import {processFile} from './process-file';
import {fillTemplate} from './fill-template';
import {Config, readConfigs} from './config';
import {Property, PropertyPrimitive} from './property';

type MetaDataTable={[key in string]:MetaData};

function writeFileIfDifferent(filename:string, contents:string){
	filename=path.resolve(filename);
	if(fs.existsSync(filename)){
		const prevContents=fs.readFileSync(filename,'ascii');
		if(prevContents===contents)
			return;
	}
	console.info('updated file',filename);
	fs.writeFileSync(filename,contents);
}

function stringifyProps(props:Property[]){
	return JSON.stringify(props,null,'\t')
		.replace(/"(\w+)"\:/g,'$1:')
		.replace(/decorators\: \[[^\]]+]/g,v=>v.replace(/[\t\n]+/g,''))
		.replace(/typeLength\: \[[^\]]+]/g,v=>v.replace(/[\t\n]+/g,''))
		.replace(/\},\s+\{/g,'},{')
		.replace(/\n/g,'\n')
		.split('\n');
}

const headerComment='//model-meta generated file\n';

async function processDir(
	config:Config,
	oldClassFiles:Set<string>,
){
	
	if(!fs.existsSync(config.outputDir))
		fs.mkdirSync(config.outputDir);

	const files=await fs.promises.readdir(config.inputDir);
	const metaData:MetaDataTable={};
	await Promise.all(files.map(file=>processFile(metaData,path.join(config.inputDir,file))));

	const values=Object.values(metaData).sort((a,b)=>a.className.localeCompare(b.className));

	const classFilenames=new Map<string,string>();
	const libModelMeta=path.relative(config.outputDir,__dirname).replace(/\\/g,'/');
	for(const data of values){
		let filename=data.className
			.replace(/^[A-Z]/,v=>v.toLowerCase())
			.replace(/[A-Z]/g,v=>'-'+v.toLowerCase())
			+'.ts';

		classFilenames.set(data.className,filename);
		filename=path.join(config.outputDir,filename);
		oldClassFiles.delete(filename);

		let props=data.properties;
		if(!config.includeSecrets)
			props=props.filter(prop=>!prop.decorators['rest.secret']);

		//const readableProps=props.filter(prop=>!prop.decorators['rest.writeonly']);
		const uniqueKeyProps=props.filter(prop=>prop.uniqueKey);
		const primitiveProps=props.filter(PropertyPrimitive.is);
		const postProps=props.filter(prop=>prop.type!=='serial');
		const authorizationProps=(config.rest?.authorizationFields ?? []).map((item):PropertyPrimitive=>({...item,decorators:{}}));
		const authorizationKeys=authorizationProps.map(prop=>`'${prop.name}'`).join('|');
		const restVisibleProps=props.filter(prop=>!prop.decorators['rest.secret']);
		const restReadableProps=restVisibleProps.filter(prop=>!prop.decorators['rest.writeonly']);
		const restReadablePrimitiveProps=restReadableProps.filter(PropertyPrimitive.is);
		const restWritableProps=restVisibleProps.filter(prop=>!prop.decorators['rest.readonly'] && prop.type!=='serial');

		const fileContents='//model-meta generated file\n'+fillTemplate({
			libModelMeta,
			name: data.className,
			route: data.route,
			comments: JSON.stringify(data.comments),
			classTypes: generateClassTypesFromProps(props),
			props: stringifyProps(props),
			propTypes: generateTypesFromProps(props),
			uniqueKeyPropTypes: generateTypesFromProps(uniqueKeyProps),
			primitivePropTypes: generateTypesFromProps(primitiveProps),
			postPropTypes: generateTypesFromProps(postProps),
			authorizationProps: stringifyProps(authorizationProps),
			authorizationKeys: authorizationKeys,
			authorizationTypes: generateTypesFromProps(authorizationProps.map((prop)=>({...prop,optional:true}))),
			restReadablePropTypes: generateTypesFromProps(restReadableProps),
			restReadablePrimitivePropTypes: generateTypesFromProps(restReadablePrimitiveProps),
			restWritablePropTypes: generateTypesFromProps(restWritableProps),
		});

		writeFileIfDifferent(filename,fileContents);
	}

// 	const fileContents=
// `${[...classFilenames.entries()].map(([name,filename])=>`import * as ${name} from './meta/${filename.slice(0,filename.length-3)}';`).join('\n')}
// export {
// 	${values.map(v=>v.className).join(',\n\t')}
// };
// `;
// 	writeFileIfDifferent(path.join(directoryName,'meta.ts'),fileContents);
}


export async function processArgs(args:CliArgs){
	let configFilename=args.args[0];
	const configs=readConfigs(configFilename);
	const outputDirs=new Set(configs.map(config=>config.outputDir));
	const oldClassFiles=new Set<string>();
	for(const outputDir of outputDirs){
		if(fs.existsSync(outputDir)){
			fs.readdirSync(outputDir)
				.map(fn=>path.join(outputDir,fn))
				.filter(fn=>{
					if(!fn.endsWith('.ts'))
						return false;
					if(!fs.readFileSync(fn,'ascii').startsWith(headerComment))
						return false;
					return true;
				})
				.forEach(v=>oldClassFiles.add(v));
		}
	}

	for(const config of configs){
		await processDir(config,oldClassFiles);
	}

	for(const filename of oldClassFiles)
		fs.unlinkSync(filename);

}
