import {HttpClient,HttpErrorResponse,HttpEventType,HttpHeaders,HttpParams,HttpParamsOptions,HttpRequest} from "@angular/common/http";
import {RestTypes as _RestTypes} from "../model-meta";
import {Observable,firstValueFrom,of,op} from "../rxjs";
import {Response,Response as _Response} from './response';
import {RestModel as _RestModel} from './rest-model';

type RestMethod='get'|'put'|'post'|'delete';
type _RestMethod=RestMethod;

interface RestArgs{
	route:string;
	method:RestMethod;
	body?:Record<string,any>;
	pollInveral?:number;
}

export class WebClient{
	constructor(
		private readonly httpClient:HttpClient,
		private readonly baseUrl:string
	){
	}

	private readonly observablesRunning=new Map<string,Observable<Response>>();

	private buildUrl(route:string, query?:HttpParamsOptions['fromObject']|null){
		if(route.startsWith('/'))
			route=`${this.baseUrl}${route}`;
		else
			route=`${this.baseUrl}/${route}`;
		if(query){
			query={...query};
			const queryStr=(new HttpParams({fromObject: query})).toString();
			if(queryStr)
				route=`${route}?${queryStr}`;
		}
		return route;
	}

	private getHttpRequest(args:RestArgs){
		const url=this.buildUrl(args.route,null);
		let body:string;
		let params:HttpParams;
		let headers:HttpHeaders;
		if(args.method==='get'){
			params=new HttpParams({fromObject:args.body})
		}else{
			if('body' in args){
				body=JSON.stringify(args.body);
				headers=new HttpHeaders({
					'content-type': 'application/json',
				});
			}
		}		
		return new HttpRequest<string>(args.method.toUpperCase(),url,body,{
			responseType: 'json',
			params,
			headers,
		})
	}
	
	public rest(args:RestArgs){
		const request=this.getHttpRequest(args);
		const http$=this.httpClient.request<any>(request);
		const value$=http$.pipe(
			op.catchError(e=>of(handleHttpErrorResponse(e))),
			op.map(evt=>{
				if(evt instanceof Response)
					return evt;
				if(evt.type===HttpEventType.Response){
					if(Math.floor(evt.status/100)===2){
						const r=new Response(evt.body);
						return r;
					}
				}
				return null;
			}),
			op.filter(v=>!!v));
		return firstValueFrom(value$);
	}

	public rest$(args:RestArgs){
		const request=this.getHttpRequest(args);
		const key=`${request.url}-${request.method}-null-`+request.body;
		let value$=this.observablesRunning.get(key);
		if(value$)
			return value$;

		const http$=this.httpClient.request<any>(request);
		value$=http$.pipe(
			op.catchError(e=>of(handleHttpErrorResponse(e))),
			op.map(evt=>{
				if(evt instanceof Response)
					return evt;
				if(evt.type===HttpEventType.Response){
					if(Math.floor(evt.status/100)===2){
						const r=new Response(evt.body);
						return r;
					}
				}
				return null;
			}),
			op.filter(v=>!!v));
		if(typeof(args.pollInveral)==='number'){
			value$=value$.pipe(
				op.repeat({delay:args.pollInveral}));
		}
		value$=value$.pipe(
			op.finalize(()=>this.observablesRunning.delete(key)),
			op.shareReplay(1));

		this.observablesRunning.set(key,value$);
		return value$;
	}

	public restUrl(args:RestArgs){
		const request=this.getHttpRequest(args);
		return request.urlWithParams;
	}
}

function handleHttpErrorResponse(
	e:HttpErrorResponse,
):Response{
	if(e.status===0)
		return Response.error(['could not connect to server']);
	if(e.status===400){
		if(e.error?.errors && typeof(e.error?.errors)==='object'){
			return Response.error(e.error.errors);
		}else
			return Response.error(['bad error']);
	}
	if(e.status===401)
		return Response.error(['unauthorized']);
	if(e.status===404)
		return Response.error(['not found']);
	if(e.status===500)
		return Response.error(['internal error']);
	return Response.error(['unknown error']);
}

export namespace WebClient{
	export type RestMethod=_RestMethod;

	export type Response=_Response;
	export const Response=_Response;

	type RestModel<
		Instance extends {id:number},
		RestTypes extends _RestTypes,
	>=_RestModel<
		Instance,
		RestTypes
	>;

	export const RestModel=_RestModel;
}
