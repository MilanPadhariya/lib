import {ModelMeta,RestTypes as _RestTypes} from '../model-meta';
import {Request} from './request';

export abstract class RestController<
	AuthType,
	Instance extends {id:number},
	RestTypes extends _RestTypes,
>{
	public constructor(
		protected readonly instanceType:{
			meta:ModelMeta;
			new ():Instance;
		},
	){
	}

	public readonly meta=this.instanceType.meta;
	public readonly route=this.meta.rest.route;

	public abstract isAuthorized(auth:RestTypes['body']['Auth']):Promise<AuthType>;

	public get?(body:Request<AuthType,RestTypes['body']['Get']>):Promise<RestTypes['response']['Get']>;
	public put?(body:Request<AuthType,RestTypes['body']['Put']>):Promise<boolean>;
	public post?(body:Request<AuthType,RestTypes['body']['Post']>):Promise<number|string>;
	public delete?(body:Request<AuthType,RestTypes['body']['Delete']>):Promise<boolean>;

	public count?(body:Request<AuthType,RestTypes['body']['Count']>):Promise<number>;
	public search?(body:Request<AuthType,RestTypes['body']['Search']>):Promise<RestTypes['response']['Search']>;
}