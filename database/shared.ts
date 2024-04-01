
export function camelCaseObject(data:any){
	//databases don't always follow the right property naming scheme so this function fixes that until we update the db
	if(data instanceof Array){
		for (let i=0; i < data.length; ++i)
			data[i]=camelCaseObject(data[i]);
		return data;
	}

	if(data instanceof Object){
		for(const name in data){
			const newName=name.replace(/_(.)/g, (p0, p1) => { return p1.toUpperCase() });
			let value=data[name];
			if(value instanceof Object)
				value=camelCaseObject(value);
			if(newName != name){
				delete data[name];
				data[newName]=value;
			}
		}
	}

	return data;
}

export function escapeStr(str:string){
	return str.replaceAll('\\','\\\\').replaceAll('\'','\\\'');
}
