import * as pg from 'pg';
import * as sql from '../sql';
import fs from 'fs';
import path from 'path';
import {Log} from '../../../log';
import { DbColumnDescriber, DbIndexDescriber, DbTableDecriber } from './interfaces';
import { camelCaseObject, escapeStr } from '../../shared';

function getEnumName(desc:sql.ColumnDesc){
	return desc.members.join('/');
}

function getPgType(
	desc:sql.ColumnDesc
){
	const {type,typeLength}=desc;
	if(type==='string' && typeLength){
		if(typeLength[0]===typeLength[1])
			return 'char('+typeLength[0]+')';
		if(typeLength[0]===0)
			return 'varchar('+typeLength[1]+')';
		return 'unknown';
	}else if(type==='string')
		return 'text';
	else if(type==='date')
		return 'timestamp';
	else if(type==='int')
		return 'int';
	else if(type==='number')
		return 'float8';
	else if(type==='enum')
		return JSON.stringify(getEnumName(desc));
	return type;
}

function columnDescToSql(
	desc:sql.ColumnDesc,
){

	let line=[`"${desc.name}"`];
	line.push(getPgType(desc));
	if(desc.type==='serial')
		line.push('primary key');
	else if(desc.uniqueKey)
		line.push('unique');
	if(desc.notNull)
		line.push('not null');
	if(desc.default!==undefined){
		if(desc.default==='now()'){
			line.push('default now()');
		}else if(desc.default===null){
			line.push('default null');
		}else if(desc.default==='uuid()'){
			line.push('default null');
		}else if(desc.type==='string'){
			line.push(`default '${desc.default}'`);
		}else
			line.push('default '+JSON.stringify(desc.default));
	}
	return line.join(' ');
}

function sqlToColumnDesc(
	desc:DbColumnDescriber,
	enums:Map<string,string[]>,
	indexes:Set<string>,
){
	const out:sql.ColumnDesc={
		name: desc.columnName,
		type: null,
		notNull: desc.isNullable==='NO',
		uniqueKey: desc.isKey,
	};

	if(desc.dataType==='integer'){
		if(desc.columnDefault===`nextval('"${desc.tableName}_${desc.columnName}_seq"'::regclass)`)
			out.type='serial';
		else
			out.type='int';
	}else if(desc.dataType==='character'){
		out.type='string';
		if(desc.characterMaximumLength!==null)
			out.typeLength=[desc.characterMaximumLength,desc.characterMaximumLength];
	}else if(desc.dataType==='character varying'){
		out.type='string';
		if(desc.characterMaximumLength!==null)
			out.typeLength=[0,desc.characterMaximumLength];
	}else if(desc.dataType==='timestamp without time zone'){
		out.type='date';
	}else if(desc.dataType==='text'){
		out.type='string';
	}else if(desc.dataType==='boolean'){
		out.type='boolean';
	}else if(desc.dataType==='inet'){
		out.type='inet';
	}else if(desc.dataType==='double precision'){
		out.type='number';
	}else if(desc.dataType==='USER-DEFINED' && enums.has(desc.udtName)){
		out.type='enum';
		out.members=enums.get(desc.udtName).slice();
	}else{
		throw Error(`unknown ${desc.dataType}`);
	}

	if(desc.columnDefault===null){
		if(!out.notNull)
			out.default=null;
	}else if(desc.columnDefault==='true'){
		out.default=true;
	}else if(desc.columnDefault==='false'){
		out.default=false;
	}else if(desc.columnDefault==='now()'){
		out.default=desc.columnDefault;
	}else if(!isNaN(+desc.columnDefault)){
		out.default=+desc.columnDefault;
	}else if(desc.columnDefault==='NULL::bpchar'){
		out.default=null;
	}else if(desc.columnDefault?.startsWith('\'')){
		if(desc.columnDefault.endsWith('::text'))
			desc.columnDefault=desc.columnDefault.substring(0,desc.columnDefault.length-6);
		out.default=desc.columnDefault.substring(1,desc.columnDefault.length-1);
	}

	if(!out.uniqueKey && indexes.has(out.name))
		out.index=true;
	return out;
}

//pg.types.setTypeParser(pg.types.builtins.FLOAT8,'text',v=>+v);
pg.types.setTypeParser(pg.types.builtins.INT8,'text',v=>+v);

export class Db extends sql.Db{
	public constructor(
		config:pg.ClientConfig,
	){
		super();

		this.pool=new pg.Pool({
			keepAlive: true,
			...config
		});
	}

	private readonly pool:pg.Pool;

	public async testConnect(){
		const connection=await this.pool.connect();
		connection.release();
	}

	public async query<
		Row extends sql.QueryRow
	>(
		statement:string,
		args:(string|number|boolean)[]=[]
	):Promise<Row[]>{
		try{
			const results=await this.pool.query(statement,args);
			return results.rows;
		}catch(e){
			if(e instanceof Error)
				e=new sql.Error(e.message+' in \n'+statement+'\n'+JSON.stringify(args));
			throw e;
		}
	}

	public async exec(
		statement:string,
		args:(string|number|boolean)[]=[]
	):Promise<number>{
		try{
			const results=await this.pool.query(statement,args);
			return results.rowCount;
		}catch(e){
			if(e instanceof Error)
				e=new sql.Error(e.message+' in \n'+statement);
			throw e;
		}
	}

	public async execScript(script:string){
		script=`begin transaction;\n${script};commit;`;
		try{
			const results=await this.pool.query(script);
			return results.rows;
		}catch(e){
			if(e instanceof Error)
				e=new sql.Error(e.message);
			throw e;
		}
	}

	public async getTables(){
		let rows=await this.query<DbTableDecriber>("select * from information_schema.tables where table_schema='public' and table_type='BASE TABLE'");
		rows=camelCaseObject(rows);
		return rows.map((row):sql.TableDesc=>({
			name: row.tableName,
		}));
	}

	public async getTable(tableName:string):Promise<sql.TableDesc>{
		const rows=await this.query<DbTableDecriber>("select * from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name=$1",[tableName]);
		const row=rows[0];
		if(!row)
			return null;

		return {
			name: row.tableName,
		};
	}

	private async getColumnQuery(table:string, column?:string){
		let query=
`select c.*, k.column_name is not null as "isKey" from information_schema.columns as c
left join information_schema.key_column_usage as k
	on c.table_catalog=k.table_catalog and c.table_schema=k.table_schema and c.table_name=k.table_name and c.column_name=k.column_name
where c.table_schema='public' and c.table_name=$1`;

		const args=[table];
		if(column){
			query+=' and c.column_name=$2';
			args.push(column);
		}
		let rows=await this.query<DbColumnDescriber>(query,args);
		return <DbColumnDescriber[]>camelCaseObject(rows);
	}

	public async getColumns(table:string){
		const rows=await this.getColumnQuery(table);
		if(rows.length<=0)
			return null;
		const enums=await this.getEnums();
		const indexes=await this.getIndexs(table);
		return rows.map(row=>sqlToColumnDesc(row,enums,indexes));
	}

	public async getColumn(table:string, column:string){
		const rows=await this.getColumnQuery(table,column);
		if(rows.length<=0)
			return null;
		const enums=await this.getEnums();
		const indexes=await this.getIndexs(table);
		return sqlToColumnDesc(rows[0],enums,indexes);
	}

	private async getIndexs(table:string){
		const query=`select * from pg_indexes where schemaname='public' and tablename=$1 order by indexname`;
		const rows=await this.query<DbIndexDescriber>(query,[table]);
		const indexes=new Set(rows.map(row=>row.indexdef.match(/\(\"?([^")]+)\"?\)$/).at(1)));
		return indexes;
	}

	private async createIndex(table:string, column:string){
		const indexName=JSON.stringify([table,column].join('_'));
		table=JSON.stringify(table);
		column=JSON.stringify(column);
		const statement=`create index if not exists ${indexName} on ${table} (${column})`;
		await this.query(statement);
	}

	private async dropIndex(table:string, column:string){
		const indexName=JSON.stringify([table,column].join('_'));
		const statement=`drop index if not exists ${indexName}`;
		await this.query(statement);
	}

	public async createTable(
		table:string,
		_columns:sql.ColumnDesc[],
	){
		for(const desc of _columns){
			if(desc.type==='enum')
				await this.createEnumIfNotExists(desc);
		}

		const columns=_columns.map(desc=>columnDescToSql(desc));
		const statement=`create table if not exists ${JSON.stringify(table)}(\n${columns.map(v=>'\t'+v).join(',\n')}\n)`;
		for(const desc of _columns){
			if(desc.index)
				await this.createIndex(table,desc.name);
		}
		await this.query(statement);
	}

	public async addColumn(
		table:string,
		desc:sql.ColumnDesc,
	){
		if(desc.type==='enum')
			await this.createEnumIfNotExists(desc);
		const column=columnDescToSql(desc);
		const statement=`alter table ${JSON.stringify(table)} add column ${column}`;
		if(desc.index)
			await this.createIndex(table,desc.name);
		await this.query(statement);
	}

	public async alterColumn(
		table:string,
		desc:sql.ColumnDesc,
	){
		const _table=JSON.stringify(table);
		const _column=JSON.stringify(desc.name);
		if(desc.notNull){
			await this.query(`alter table ${_table} alter column ${_column} set not null`);
		}else{
			await this.query(`alter table ${_table} alter column ${_column} drop not null`);
		}
		if(desc.index){
			await this.createIndex(table,desc.name);
		}else{
			await this.dropIndex(table,desc.name);
		}
		// let line=[`"${desc.name}"`];
		// line.push(getPgType(desc.type,desc.typeLength));
		// if(desc.type==='serial')
		// 	line.push('primary key');
		// else if(desc.uniqueKey)
		// 	line.push('unique');
		// if(desc.notNull)
		// 	line.push('not null');
		// if(desc.default!==undefined){
		// 	if(desc.default==='now()'){
		// 		line.push('default now()');
		// 	}else if(desc.default===null){
		// 		line.push('default null');
		// 	}else if(desc.default==='uuid()'){
		// 		line.push('default null');
		// 	}else if(desc.type==='string'){
		// 		line.push(`default '${desc.default}'`);
		// 	}else
		// 		line.push('default '+JSON.stringify(desc.default));
		// }
		// return line.join(' ');
	}

	public getTableKey(table:string, columnName:string){
		return this.query('select * from information_schema.key_column_usage where table_schema=\'public\' and table_name=$1 and column_name',[table,columnName]);
	}

	private _enums:Map<string,string[]>;

	private async getEnums(){
		if(!this._enums){
			const rows=await this.query<{name:string,member:string}>('select t.typname as name,e.enumlabel as member from pg_type t join pg_enum e on t.oid=e.enumtypid');
			this._enums=new Map<string,string[]>();
			for(const {name} of rows)
				this._enums.set(name,[]);
			for(const {name,member} of rows)
			this._enums.get(name).push(member);
		}
		return this._enums;
	}

	private async createEnumIfNotExists(desc:sql.ColumnDesc){
		const name=getEnumName(desc);
		const enums=await this.getEnums();
		if(!enums.has(name)){
			const membersStr=desc.members.map(m=>`'${escapeStr(m)}'`).join(',');
			const statement=`create type ${JSON.stringify(name)} as enum (${membersStr})`;
			await this.query(statement);
		}
	}

	public async runMigration(
		log:Log,
		migrationDir:string,
	){
		const migrationFilenamePattern=/^\d{4}-\d{2}-\d{2}-\d{2}\d{2}-.*\.sql$/;
		let files:string[]=[];
		if(fs.existsSync(migrationDir))
			files=fs.readdirSync(migrationDir);//.map(fn=>path.join(migrationDir,fn));
		const invalidFiles=files.filter(fn=>!fn.match(migrationFilenamePattern));
		for(const fn of invalidFiles)
			log.warn('found invalid file in the migration directory:',fn);
		files=files.filter(fn=>fn.match(migrationFilenamePattern));

		const migrationTable='--migrations';
		if(await this.getTable(migrationTable)){
			log.info('Found migration table');
			const rows=await this.select().all().from(migrationTable).exec<{id:number,filename:string}>();
			const runFiles=new Set(rows.map(r=>r.filename));
			files=files.filter(fn=>!runFiles.has(fn));
			for(let filename of files){
				log.info(`running migration file "${filename}"`);
				let script=fs.readFileSync(path.join(migrationDir,filename),'ascii');
				await this.execScript(script);
				await this.insertInto(migrationTable).values({filename}).exec();
			}
		}else{
			const columns=[
				'id serial primary key not null',
				'filename text not null',
			];

			log.info('Creating migration table');
			const statement=`create table ${JSON.stringify(migrationTable)}(\n${columns.map(v=>'\t'+v).join(',\n')}\n)`;
			await this.exec(statement);
			if(files.length>0){
				await this.insertInto(migrationTable)
					.values(files.map(filename=>({filename})))
					.exec();
			}
		}
	}
}
