export interface VecLike{
	x:number;
	y:number;
	z?:number;
}

export interface Vec{
	x:number;
	y:number;
	z?:number;

	toArray():number[];
	toArray<T extends {[i:number]:number}>(out:T, i?:number):T;
	fromArray(array:ArrayLike<number>, i?:number):this;

	clone():this;
	copy(that:VecLike):this;
	// applyFunc(fn:(v:number)=>number):this;

	setAll(v:number):this;

	neg():this;
	inv():this;
	abs():this;
	floor():this;
	ceil():this;
	round():this;
	
	min(that:VecLike):this;
	max(that:VecLike):this;
	add(that:VecLike):this;
	addScaled(that:VecLike, s:number):this;
	sub(that:VecLike):this;
	mul(that:VecLike):this;
	div(that:VecLike):this;
	mod(that:VecLike):this;
	lerp(that:VecLike, f:number):this;
	mean(that:VecLike):this;
	mix(that:VecLike, f:VecLike):this;

	sum(a:VecLike, b:VecLike):this;
	diff(a:VecLike, b:VecLike):this;

	translate(delta:number):this;
	scale(scale:number):this;
	invScale(scale:number):this;
	frac():this;

	dot(that:VecLike):number;
	lenSq():number;
	len():number;
	nrm():this;

	distToSq(that:VecLike):number;
	distTo(that:VecLike):number
	distToSqXY(that:VecLike):number;
	distToXY(that:VecLike):number

	eq(that:VecLike):boolean;
	isValid():boolean;
	isFinite():boolean;
}

export namespace Vec{
	export function azimuth(that:Vec):number|undefined;
	export function azimuth<T extends Vec>(that:T, az:number):T;
	export function azimuth<T extends Vec>(that:T, az?:number):number|undefined|T;
	export function azimuth<T extends Vec>(that:T, az?:number){
		if(az===undefined){
			if(that.x===0 && that.y===0)
				return undefined;
			return Math.atan2(that.x,that.y);
		}
		const l=Math.sqrt(that.x**2+that.y**2);
		that.x=Math.sin(az)*l;
		that.y=Math.cos(az)*l;
		return that;
	}
// 	export function mean(those:[]):null;
// 	export function mean<T extends Vec>(those:[T,...T[]]):T;
// 	export function mean<T extends Vec>(those:Iterable<T>):T|null;
// 	export function mean(those:Iterable<Vec>):Vec|null{
// 		let out:Vec|null=null;
// 		let count=0;
// 		for(const that of those){
// 			if(out)
// 				out.add(that);
// 			else			
// 				out=that.clone();
// 			count+=1;
// 		}
// 		out?.invScale(count);
// 		return out;
// 	}
}
