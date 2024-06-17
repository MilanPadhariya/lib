import * as sqlite from 'sqlite3';
import * as sql from '../sql';

function getSqlType(type:sql.ColumnType, typeLength:[number,number]|undefined){
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
	return type;
}

function columnDescToSql(
	desc:sql.ColumnDesc,
){
	let line=[`"${desc.name}"`];
	line.push(getSqlType(desc.type,desc.typeLength));
	if(desc.type==='serial')
		line.push('primary key');
	else if(desc.uniqueKey)
		line.push('unique');
	if(desc.notNull)
		line.push('not null');
	if(desc.default!==undefined){
		if(desc.default==='now()'){
			line.push('default now()');
		}else if(desc.default==='uuid()'){
			line.push('default null');
		}else if(desc.type==='string'){
			line.push(`default '${desc.default}'`);
		}else
			line.push('default '+JSON.stringify(desc.default));
	}
	return line.join(' ');
}

export class Db extends sql.Db{
	public static async open(filename:string){
		const that=new Db(filename);
		await that.open()
		return that;
	}

	private constructor(filename:string){
		super();
		this.db=new sqlite.Database(filename);
	}

	private readonly db:sqlite.Database;

	private open(){
		return new Promise<void>(resolve=>{
			this.db.on('open',()=>{
				resolve();
			});
		});
	}

	public close(){
		return new Promise<void>((resolve,reject)=>{
			this.db.close(err=>{
				if(err)
					reject(err);
				else
					resolve();
			});
		});
	}

	public async query<
		Row extends sql.QueryRow
	>(
		statement:string,
		args:(string|number|boolean)[]=[]
	):Promise<Row[]>{
		return new Promise<Row[]>((resolve,reject)=>{
			this.db.all<Row>(statement,args,function(r,rows){
				if(r instanceof Error)
					reject(new sql.Error(r.message+' in \n'+statement));
				else
					resolve(rows);
			});
		});
	}

	public async exec(
		statement:string,
		args:(string|number|boolean)[]=[]
	):Promise<number>{
		return new Promise<number>((resolve,reject)=>{
			this.db.run(statement,args,function(r){
				if(r instanceof Error)
					reject(new sql.Error(r.message+' in \n'+statement));
				else
					resolve(this.changes);
			});
		});

	}

	public async getTables():Promise<sql.TableDesc[]>{
		return this.query<sql.TableDesc>("SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';'")
	}

	public async getColumns(tableName:string):Promise<sql.ColumnDesc[]>{
		const rows=await this.query<{sql:string}>("SELECT sql FROM sqlite_schema WHERE type ='table' AND name=$1",[tableName]);
		if(rows.length===0)
			return null;
		// const r=await this.query("SELECT name FROM sqlite_schema WHERE type ='table' AND name=$1",[tableName]);
		let lines=rows[0].sql.split('\n').slice(1);
		lines.pop();
		const columns=lines.map((line):sql.ColumnDesc=>{
			line=line.trim();
			line=line.replace(/,$/,'');
			line=line.replaceAll('not null','notNull');
			line=line.replaceAll('serial primary key','serialPrimaryKey');
			let items=line.split(/\s+/g);

			let name=items.shift();
			name=name.substring(1,name.length-1);
			let uniqueKey=false;
			let type:sql.ColumnType;
			let notNull=false;

			if(items[0]==='serialPrimaryKey'){
				type='serial';
				uniqueKey=true;
			}else if(items[0]==='int'){
				type='int';
			}else if(items[0]==='float8'){
				type='number';
			}else
				throw Error('unknown column type \n'+line);
			items=items.slice(1);

			if(items[0]==='notNull'){
				notNull=true;
				items.shift();
			}

			let _default:sql.ColumnDesc['default'];
			if(items[0]==='default'){
				items.shift();
				_default=items[0];
				if(!isNaN(+_default))
					_default=+_default;
			}

			return {
				name,
				type,
				uniqueKey,
				notNull,
				default: _default,
			};
		});
		return columns;
	}

	public async createTable(
		tableName:string,
		_columns:sql.ColumnDesc[],
	){
		const columns=_columns.map(desc=>columnDescToSql(desc));
		const statement=`create table if not exists ${JSON.stringify(tableName)}(\n${columns.map(v=>'\t'+v).join(',\n')}\n)`;
		await this.query(statement);
	}

	public async addColumn(
		tableName:string,
		desc:sql.ColumnDesc,
	){
		const column=columnDescToSql(desc);
		const statement=`alter table ${JSON.stringify(tableName)} add column ${column}`;
		await this.query(statement);
	}

	public getTableKey(tableName:string, columnName:string){
		return this.query('select * from information_schema.key_column_usage where table_schema=\'public\' and table_name=$1 and column_name',[tableName,columnName]);
	}
}
