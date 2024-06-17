import {Observable, Subscriber} from "rxjs";

export class ValueSubject<T> extends Observable<T>{
	public constructor(
		private _value:T,
	){
		super(subscriber=>{
			this.subscribers.add(subscriber);
			subscriber.next(this.value);
			return ()=>{
				this.subscribers.delete(subscriber);
				if(this.subscribers.size===0)
					this.onLastUnsubscribed();
			};
		});
	}

	private readonly subscribers=new Set<Subscriber<T>>();
	public readonly completeThis=true;

	public get value(){
		return this._value;
	}

	protected onLastUnsubscribed(){
	}

	public next(v:T){
		this._value=v;
		for(const subscriber of this.subscribers)
			subscriber.next(v);
	}

	public complete(){
		for(const subscriber of this.subscribers)
			subscriber.complete();
		this.onLastUnsubscribed();
	}
}