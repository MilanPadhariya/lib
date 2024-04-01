import fs from 'fs';

type EnvTable=Record<string,string|number|boolean>;

class Environment{
	public constructor(){
		for(const [key,val] of Object.entries(process.env))
			this.table[key.toUpperCase()]=val;

		if(fs.existsSync('./environment.json')){
			const table=<EnvTable>JSON.parse(fs.readFileSync('./environment.json','ascii'));
			for(const [key,val] of Object.entries(table))
				this.table[key.toUpperCase()]=val;
		}
		for(let i=1;i<process.argv.length;++i){
			const arg=process.argv[i].trim();
			const matches=/--([a-zA-Z0-9]+)=(.+)/.exec(arg);
            if(matches)
				this.table[matches[1].toUpperCase()]=matches[2];
		}
	}

	private readonly table:EnvTable={};

	public get(key:string){
		return this.table[key.toUpperCase()];
	}
}

export const environment=new Environment();