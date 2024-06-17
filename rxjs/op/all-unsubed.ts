import { Observable, OperatorFunction, Subject } from "rxjs";

export function unsubscribed<T>(callback:()=>void):OperatorFunction<T,T>{
	let count=0;
	return source=>new Observable(subscriber=>{
		count+=1;
		let sub=source.subscribe(subscriber);
		return ()=>{
			count-=1;
			if(count===0)
				callback();
			sub.unsubscribe();
		}
	});
}

/*
const subject$=new Subject<number>()
	
const sub=subject$
	.pipe(unsubscribed(()=>console.info('works')))
	.subscribe(v=>console.info('out',v));
	
subject$.next(1);
subject$.next(2);
subject$.next(3);
sub.unsubscribe();
/**/
