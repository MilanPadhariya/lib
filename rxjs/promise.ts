import { Observable, firstValueFrom, lastValueFrom } from "rxjs";

export function promiseFirst<T>(source:Observable<T>, defaultValue:T){
	return firstValueFrom<T,T>(source,{defaultValue});
}

export function promiseLast<T>(source:Observable<T>, defaultValue:T){
	return lastValueFrom<T,T>(source,{defaultValue});
}
