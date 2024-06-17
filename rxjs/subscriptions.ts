import { Subscription } from 'rxjs';

export class Subscriptions<Key=string>{
	private readonly named=new Map<Key,Subscription>();
	private readonly anonymous=new Set<Subscription>();

	public set(key:Key,s:Subscription){
		const _s=this.named.get(key);
		if(_s)
			_s.unsubscribe();
		if(s instanceof Subscription)
			this.named.set(key,s);
		else
			this.named.delete(key);
	}

	public delete(key:Key){
		this.named.get(key)?.unsubscribe();
		return this.named.delete(key);
	}

	public has(key:Key){
		return this.named.has(key);
	}

	// Only to be called where the code will execute only once. Like a constructor or ngOninit.
	public add(s:Subscription){
		this.anonymous.add(s);
	}

	public unsubscribe(key?:Key){//|((key:Key)=>boolean)){
		if(key==undefined){
			this.named.forEach(s=>s?.unsubscribe());
			this.named.clear();
			this.anonymous.forEach(s=>s.unsubscribe());
			this.anonymous.clear();
		}else{
			const s=this.named.get(key);
			if(s){
				this.named.delete(key);
				s.unsubscribe();
			}
		}
	}
}
