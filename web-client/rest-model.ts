import {Observable,op} from '../rxjs';
import {ModelMeta,RestTypes as _RestTypes} from '../model-meta';
import {WebClient} from './web-client';

export abstract class RestModel<
	Instance extends {id:number},
	RestTypes extends _RestTypes,
>{
	public constructor(
		private readonly instanceType:{
			meta:ModelMeta;
			new ():Instance;
		},
		private readonly webClient:WebClient
	){
	}
	
	public readonly meta=this.instanceType.meta;
	public readonly route=this.meta.rest.route;

	public abstract auth():{};

	public get(body:RestTypes['body']['Get']):Promise<Instance>{
		body={
			...this.auth(),
			...body
		};
		return this.webClient.rest({
			route: this.route,
			method: 'get',
			body,
		}).then(r=>r.to(this.instanceType));
	}

	public put(body:RestTypes['body']['Put']):Promise<boolean>{
		body={
			...this.auth(),
			...body
		};
		return this.webClient.rest({
			route: this.route,
			method: 'put',
			body,
		}).then(r=>r.toBool());
	}

	public post(body:RestTypes['body']['Post']):Promise<number>{
		body={
			...this.auth(),
			...body
		};		
		return this.webClient.rest({
			route: this.route,
			method: 'post',
			body,
		}).then(r=>r.toInt());
	}

	public delete(body:RestTypes['body']['Delete']|Instance):Promise<boolean>{
		if(body instanceof this.instanceType){
			body={
				where: body.id
			}
		}
		body={
			...this.auth(),
			...body
		};
		return this.webClient.rest({
			route: this.route,
			method: 'delete',
			body,
		}).then(r=>r.toBool());
	}

	public count(body:RestTypes['body']['Count']):Promise<number>{
		body={
			...this.auth(),
			...body
		};
		return this.webClient.rest({
			route: this.route+'/count',
			method: 'post',
			body,
		}).then(r=>r.toInt());			
	}

	public search(body:RestTypes['body']['Search']):Promise<Instance[]>{
		body={
			...this.auth(),
			...body
		};
		return this.webClient.rest({
			route: this.route+'/search',
			method: 'post',
			body,
		}).then(r=>r.toArray(this.instanceType));			
	}
	
	public get$(body:RestTypes['body']['Get']):Observable<Instance>{
		body={
			...this.auth(),
			...body
		};		
		return this.webClient.rest$({
			route: this.route,
			method: 'get',
			body,
		}).pipe(op.map(r=>r.to(this.instanceType)));
	}

	public count$(body:RestTypes['body']['Count']):Observable<number>{
		body={
			...this.auth(),
			...body
		};
		return this.webClient.rest$({
			route: this.route+'/count',
			method: 'post',
			body,
		}).pipe(op.map(r=>r.toInt()));
	}

	public search$(body:RestTypes['body']['Search']):Observable<Instance[]>{
		body={
			...this.auth(),
			...body
		};
		return this.webClient.rest$({
			route: this.route+'/search',
			method: 'post',
			body,
		}).pipe(op.map(r=>r.toArray(this.instanceType)));
	}

	public async save(
		instance:Instance
	){
		if(instance.id){
			const body:RestTypes['body']['Put']={
				where: instance.id,
				fields: this.meta.rest.put.fields.copyFields(instance,{}),
			};
			return this.put(body);
		}
		const body:RestTypes['body']['Post']={
			fields: this.meta.rest.post.fields.copyFields(instance,{}),
		};
		const id=await this.post(body);
		if(id){
			instance.id=id;
			return true;
		}
		return false;
	}
}