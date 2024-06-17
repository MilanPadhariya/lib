import * as bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import * as path from 'path';
import {Log} from '../log';
import {RestTypes as _RestTypes} from '../model-meta';
import {Observable,firstValueFrom,op} from '../rxjs';
import {ErrorRtrn,ErrorRtrn as _ErrorRtrn} from './error-return';
import {Request,Request as _Request} from './request';
import {RestController,RestController as _RestController} from './rest-controller';
import zlib from 'zlib';

export class WebServer{
	constructor(
		private readonly log:Log,
	){
		const _cors=cors({
			origin: 'http://localhost:4200',
			optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
		});
		this.app.use(_cors);
		this.app.use(bodyParser.json());
	}

	private readonly app=express();

	private async checkAuthorization<AuthType,Body>(
		req:express.Request,
		res:express.Response,
		isAuthorized:(body:Body)=>Promise<AuthType>,
		body:Body,
	){
		let authorized:AuthType;
		try{
			authorized=await isAuthorized(body);
			if(!authorized){
				this.log.info('unorthorized access from ',req.socket.remoteAddress);
				res.sendStatus(401);
				return null;
			}
		}catch(e){
			this.sendInternalError(req.route,res,e);
			return null;
		}
		return authorized;
	}

	private buildRequest<AuthType,Body>(
		req:express.Request,
		authorization:AuthType,
		bodyType:'body'|'query',
	){
		let [ip,port]=(req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress ?? '').split(':');
		if(!ip)
			ip='0.0.0.0';
		if(!port)
			port='0';

		const request:Request<AuthType,Body>={
			route: req.route.path,
			ip,
			port,
			auth: authorization,
			body: req[bodyType]
		};
		return request;
	}

	private sendErrorRtrn(res:express.Response<any>, e:ErrorRtrn){
		res.status(400).json(e);
	}
	
	private sendInternalError(
		route:string,
		res:express.Response<any>,
		e:any
	){
		this.log.error(e);
		res.sendStatus(500);
	}
	
	private handleException(
		route:string,
		res:express.Response<any>,
		e:any
	){
		if(e instanceof ErrorRtrn){
			if(e.code===401){
				res.sendStatus(401);
			}else{
				this.log.info('error-response',e.toString().split('\n'));
				this.sendErrorRtrn(res,e);
			}
		}else
			this.sendInternalError(route,res,e);
	}

	public restRoute<AuthType>(
		controller:WebServer.RestRoute<AuthType>,
	){
		const callback=async (req:express.Request,res:express.Response<any>)=>{
			const beginTime=Date.now();
			let auth:AuthType;
			if(controller.isAuthorized){
				auth=await this.checkAuthorization(
					req,
					res,
					(body)=>controller.isAuthorized(body),
					controller.method==='get'?req.query:req.body
				);
				if(!auth)
					return;
			}else{
				auth=null;
			}

			try{
				const request=this.buildRequest<AuthType,{}>(
					req,
					auth,
					controller.method==='get'?'query':'body'
				);
				let out=await controller.handle(request);
				res.status(200);
				const contentType=controller.contentType ?? 'application/json';
				res.contentType(contentType);
				if(contentType==='application/json'){
					out=JSON.stringify(out);
					if(controller.compress){
						const acceptedEncodings=getAcceptedEncodings(req);
						if(acceptedEncodings.includes('deflate')){
							out=await new Promise(resolve=>zlib.deflate(out,(err,result)=>resolve(result)));
							res.header('Content-Encoding','deflate');
						}
					}
					res.send(out);
				}else
					res.send(out?.toString());
			}catch(e){
				this.handleException(req.route,res,e);
			}
			const duration=Date.now()-beginTime;
			if(duration>100)
				this.log.warn('response took to [',controller.route,',',controller.method,'] ',duration,'ms');
		};

		const {route,method}=controller;
		if(method==='delete')
			this.app.delete(route,callback);
		else if(method==='get')
			this.app.get(route,callback);
		else if(method==='post')
			this.app.route(route).post(callback);
		else if(method==='put')
			this.app.put(route,callback);
		else
			throw Error('bad method');
	}

	public modelRoute<AuthType>(
		controller:RestController<AuthType,any,any>,
	){
		const callback=async (req:express.Request,res:express.Response<any>)=>{
			let method=<WebServer.RestMethod|'count'|'search'>req.method.toLowerCase();
			const route:string=req.route.path;
			if(route.endsWith('/count'))
				method='count';
			else if(route.endsWith('/search'))
				method='search';

			const auth=await this.checkAuthorization(req,res,(body)=>controller.isAuthorized(body),method==='get'?req.query:req.body);
			if(!auth)
				return;
			try{
				const request=this.buildRequest(req,auth,method==='get'?'query':'body');
				const errors=controller.meta.rest[method].validate(request.body);
				if(errors.length>0)
					throw new ErrorRtrn(errors);
				const out=await controller[method](<any>request);
				res.status(200);
				res.contentType('application/json');
				res.send(JSON.stringify(out));
			}catch(e){
				this.handleException(req.route,res,e);
			}
		}
		let route='/'+controller.meta.rest.route;
		if(controller.get)
			this.app.get(route,callback);
		if(controller.put)
			this.app.put(route,callback);
		if(controller.post)
			this.app.post(route,callback);
		if(controller.delete)
			this.app.delete(route,callback);
		if(controller.count)
			this.app.post(route+'/count',callback);
		if(controller.search){
			this.app.post(route+'/search',callback);
		}
	}

	public textRoute(route:string|RegExp|string[], body:string){
		this.app.get(route,async (req,res:express.Response<string>)=>{
			res.send(body);
		});
	}

	public fileRoute(route:string|RegExp|string[], filePathBase:string){
		filePathBase=path.resolve(filePathBase);
		this.app.get(route,async (req,res:express.Response<string>)=>{
			let filePath=filePathBase;
			const subRoute=req.params['0'];
			if(subRoute)
				filePath=path.resolve(filePathBase,subRoute);

			if(filePath.startsWith(filePathBase)){
				const worked=await new Promise(resolve=>res.sendFile(filePath,e=>resolve(!e)));
				if(worked)
					return;

				filePath=path.resolve(filePathBase,'index.html');
				res.sendFile(filePath);
				return;
			}
			res.sendStatus(404);
		});
	}

	public streamingRoute(
		route:string,
		contentType:string,
		data$:Observable<Buffer|string>,
	){
		this.app.get(route,(req,res)=>{
			const boundary='frame';
			res.writeHead(200,{
				'Content-Type': `multipart/x-mixed-replace; boundary=--${boundary}`
			});

			res.write(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`);
			let sub=data$
			.pipe(op.debounceTime(0))
			.subscribe({
				error: e=>{
					this.log.error(e);
					res.end();
				},
				next: data=>{
					res.write(data);
					res.write(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`);
				},
				complete: ()=>{
					res.end();
				},
			});
			req.on('close',()=>{
				sub?.unsubscribe();
				sub=null;
			});
		});
		this.app.get(route+'/still', async (req, res) => {
			try{
				res.setHeader('Content-Type', contentType);
				const data=await firstValueFrom(data$.pipe(op.timeout(1000)));
				res.send(data);
			}catch(e){
				this.sendInternalError(req.route,res,e);
			}
		});		
	}

	public listen(
		port:number,
	){
		this.app.listen(port,()=>{
			this.log.info('server is running on port',port);
		});
	}
}

function getAcceptedEncodings(req:express.Request){
	const out:string[]=[];
	const header=req.headers['accept-encoding'];
	if(!header)
		return out;

	if(Array.isArray(header))
		return header.flatMap(v=>v.split(',')).map(v=>v.trim());
	return header.split(',').map(v=>v.trim());
}

export namespace WebServer{
	export type RestMethod='delete'|'get'|'post'|'put';

	export const ErrorRtrn=_ErrorRtrn;
	export type ErrorRtrn=_ErrorRtrn;

	export type Request<AuthType,Body=Record<string,any>>=_Request<AuthType,Body>;

	export interface RestRoute<AuthType>{
		route:string;
		method:WebServer.RestMethod;
		contentType?:string;
		compress?:boolean;
		isAuthorized?(body:{}):Promise<AuthType>;
		handle(request:Request<AuthType,{}>):Promise<any>;
	}
	
	export type RestController<
		AuthType,
		Instance extends {id:number},
		RestTypes extends _RestTypes,
	>=_RestController<AuthType,Instance,RestTypes>;
	export const RestController=_RestController;
}
