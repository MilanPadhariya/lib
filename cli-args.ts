
export class CliArgs{
	public constructor(entryPointFilename:string){
		const argArray=process.argv.slice(process.argv.indexOf(entryPointFilename)+1);
		for(let arg of argArray){
			if(arg.startsWith('--')){
				arg=arg.substring(2);
				const [name,value]=arg.split('=');
				if(name===undefined)
					throw new Error('could not parse cli args');
				if(value===undefined)
					this.flags.add(name);
				else
					this.values[name]=value;
			}else if(arg.startsWith('-')){
				arg=arg.substring(1);
				for(const flag of arg.split(''))
					this.flags.add(flag);
			}else{
				this.args.push(arg);
			}
		}
	
	}

	public readonly flags=new Set<string>();
	public readonly values:Record<string,string>={};
	public readonly args:string[]=[];
}
