import {BehaviorSubject,Observable,of,switchMap, takeUntil} from "rxjs";

const nonValue={};

export class OverrideSubject<T> extends Observable<T>{
	public constructor(
		default$:Observable<T>
	){
		super(subscriber=>this.override$
			.pipe(
				switchMap((v):Observable<T>=>{
					if(v===nonValue){
						return default$;
					}
					return of(<T>v);
				}))
			.subscribe(subscriber));
	}

	private readonly override$=new BehaviorSubject<T|(typeof nonValue)>(nonValue);

	public next(v:T){
		this.override$.next(v);
	}

	public complete(){
		this.override$.complete();
	}
}