import {sql} from '../database/sql';
import {Log} from '../log';
import {ModelMeta,PropertyContainer,PropertyPrimitive} from "../model-meta";
import {WhereTable} from "../where";

function getTableProps(meta:ModelMeta){
	return [...meta]
		.filter(PropertyPrimitive.is)
		.filter(prop=>!prop.decorators['rest.writeonly'])
}

function getSubtableProps(meta:ModelMeta){
	return [...meta].filter(PropertyContainer.is);
}

function cleanFields(meta:ModelMeta, fields:Record<string,any>){
	const _fields:Record<string,string|number|boolean|Date>={};
	for(const prop of meta.primitives){
		const v=fields[prop.name];
		const t=typeof(v);
		if(t==='string' || t==='number' || t==='boolean' || v instanceof Date)
			_fields[prop.name]=v;
	}
	return _fields;
}

export class ObjRepo<
	Instance extends {id:number}
>{
	public constructor(
		private readonly instanceType:{
			meta:ModelMeta;
			new ():Instance;
		},		
		public readonly db:sql.Db
	){
	}

	public readonly meta=this.instanceType.meta;

	public async createTable(){
		const {meta}=this;
		const tableName=meta.name;
		const tableProps=getTableProps(meta);
	
		await this.db.createTable(tableName,tableProps
			.map((prop):sql.ColumnDesc=>{
				return {
					...prop,
					default: typeof(prop.default)==='function'?undefined:prop.default,
				}
			}));
	
		const subtableProps=getSubtableProps(meta);
		for(const prop of subtableProps){
			if(prop.type==='array'){
				const subTableName=[tableName,prop.name].join('.');
				await this.db.createTable(subTableName,[
					{
						name: 'id',
						type: 'serial',
					},{
						name: 'parentId',
						type: 'int',
						notNull: true,
					},{
						name: prop.name,
						type: prop.value.type,
						typeLength: prop.value.typeLength,
						notNull: true,
					}
				]);
			}
		}
	}

	public async validateTable(opts:{
		addMissingColumns?:boolean,
		alterColumns?:boolean,
		log:Log,
	}){
		const {db,meta}=this;
		let columns=await db.getColumns(meta.name);
		if(!columns)
			throw new ObjRepo.ValidationError(`table does not exist`);
		let columnMap=new Map(columns.map(row=>[row.name,row]));
		
		const tableProps=getTableProps(meta);
		const columnsMissing=tableProps.filter(prop=>!columnMap.has(prop.name));
		if(columnsMissing.length>0){
			if(opts.addMissingColumns){
				for(const prop of columnsMissing){
					opts.log.info(`adding missing column ${meta.name}.${prop.name}`);
					await db.addColumn(meta.name,prop);
					const column=await db.getColumn(meta.name,prop.name);
					columns.push(column);
					columnMap.set(column.name,column);
				}
			}else
				throw new ObjRepo.ValidationError(`missing columns ${columnsMissing.map(prop=>'"'+prop.name+'"').join(', ')}`);
		}
	
		
		const columnErrors=new Map<string,string[]>();
		for(const prop of tableProps){
			let column=columnMap.get(prop.name);
			let errors=validateColumn(column,prop);
			if(errors){
				if(opts.alterColumns){
					opts.log.info(
						`altering column ${meta.name}.${prop.name} from\n`,
						JSON.stringify(column,undefined,'\t'),
						'\nto\n',
						JSON.stringify(sql.ColumnDesc.cleanInterface(prop),undefined,'\t'),
					);
					this.db.alterColumn(meta.name,prop);
					column=await db.getColumn(meta.name,prop.name);
					opts.log.info('altered to',JSON.stringify(column,undefined,'\t'));
					columns.push(column);
					columnMap.set(column.name,column);
					errors=validateColumn(columnMap.get(prop.name),prop);
				}
				if(errors)
					columnErrors.set(prop.name,errors);
			}
		}
	
		if(columnErrors.size>0){
			const errors=[...columnErrors.entries()].flatMap(([name,errors])=>['\t'+name,...errors.map(v=>'\t\t'+v)]);
			throw new ObjRepo.ValidationError(`has column errors:\n${errors.join('\n')}`);
		}
	}	
		
	public async get(
		where:WhereTable,
	):Promise<Instance|null>{
		const rows=await this.db
			.select()
			.from(this.meta.name)
			.where(where)
			.limit(1)
			.exec();
		if(rows && rows[0]){
			const instance=new this.instanceType();
			Object.assign(instance,rows[0]);
			return instance;
		}
		return null;
	}

	public delete(
		where:WhereTable,
	){
		return this.db.deleteFrom(this.meta.name)
			.where(where)
			.exec();
	}

	public put(
		where:WhereTable,
		fields:Record<string,any>
	){
		fields=cleanFields(this.meta,fields);
		return this.db.update(this.meta.name)
			.values(fields)
			.where(where)
			.exec();
	}
		
	public async post(
		fields:Record<string,any>,
	){
		fields=cleanFields(this.meta,fields);
		const ids=await this.db.insertInto(this.meta.name)
			.values(fields)
			.exec();
		if(ids && typeof(ids[0])==='number' && ids[0]>0)
			return ids[0];
		return null;
	}

	public count(
		where:WhereTable,
	):Promise<number|null>{
		return this.db.count(this.meta.name)
			.where(where)
			.exec();
	}

	public async search(
		where:WhereTable,
		orderBy?:Record<string,'+'|'-'>,
		offset?:number,
		limit?:number,
	):Promise<Instance[]|null>{
		const statement=this.db
			.select()
			.from(this.meta.name)
			.where(where)
			.orderBy(orderBy)
			.offset(offset)
			.limit(limit);
		const rows=await statement.exec();
		if(rows){
			return rows.map(row=>{
				const instance=new this.instanceType();
				Object.assign(instance,row);
				return instance;
			});
		}
		return null;
	}
	
	public async insert(instances:Instance[]){
		if(instances.length===0)
			return true;
		const fields=instances.map(instance=>cleanFields(this.meta,instance));
		const ids=await this.db.insertInto(this.meta.name)
			.values(fields)
			.exec();
		if(ids){
			for(const [i,instance] of instances.entries())
				instance.id=ids[i];
			return true;
		}
		return false;
		
	}

	public async save(
		instance:Instance,
	){
		let id=instance['id'];
		if(typeof(id)==='number' && id>0){
			const rowCount=await this.put({id},instance);
			return rowCount>0;
		}
		id=await this.post(instance);
		if(typeof(id)==='number' && id>0){
			instance.id=id;
			return true;
		}
		return false;
	}
		
}

export namespace ObjRepo{
	export class ValidationError extends Error{
	}
}

function buildColumnError(error:string, columnValue:sql.ColumnDesc[keyof sql.ColumnDesc], propValue:sql.ColumnDesc[keyof sql.ColumnDesc]){
	columnValue=JSON.stringify(columnValue);
	propValue=JSON.stringify(propValue);
	return `${error}\twanted ${columnValue}\tgot ${propValue}`;
}

function validateColumn(
	column:sql.ColumnDesc,
	prop:PropertyPrimitive
){
	const columnErrors:string[]=[];
	if(column.name!==prop.name)
		columnErrors.push(buildColumnError('name',column.name,prop.name));
	if(column.type!==prop.type){
		columnErrors.push(buildColumnError('type',column.type,prop.type));
	}else if(column.type==='enum'){
		if(!(column.members.length===prop.members.length && column.members.every((v,i)=>prop.members[i]===v)))
			columnErrors.push(buildColumnError('members',column.members,prop.members));
	}
	if(!!column.notNull!==!!prop.notNull)
		columnErrors.push(buildColumnError('notNull',!!column.notNull,!!prop.notNull));
	if(JSON.stringify(column.typeLength)!==JSON.stringify(prop.typeLength))
		columnErrors.push(buildColumnError('typeLength',column.typeLength,prop.typeLength));
	if(column.default!==prop.default && !(column.default===null && prop.default==='uuid()'))
		columnErrors.push(buildColumnError('default',column.default,prop.default));
	if(!!column.uniqueKey!==!!prop.uniqueKey)
		columnErrors.push(buildColumnError('uniqueKey',!!column.uniqueKey,!!prop.uniqueKey));
	if(!!column.index!==!!prop.index)
		columnErrors.push(buildColumnError('index',!!column.index,!!prop.index));

	if(columnErrors.length>0)
		return columnErrors;
	return null;
}
