import { Observable } from 'rxjs';

export function taste<T>(observable:Observable<T>){
	let v:T;
	observable.subscribe(_v=>v=_v).unsubscribe();
	return v;
}
