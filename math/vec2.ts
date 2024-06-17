
import * as three from 'three';
import { isFiniteNumber,isValidNumber } from '../number';
import { Vec } from './vec';
import { Vec3 } from './vec3';

export type Vec2Like={x:number,y:number};

export class Vec2 extends three.Vector2 implements Vec{
	//public z:undefined;

	public toString(){
		return `(${this.x},${this.y})`;
	}

	public toXYZ(z:number){
		return new Vec3(this.x,this.y,z);
	}

	public applyFunc(fn:(v:number)=>number):this{
		this.x=fn(this.x);
		this.y=fn(this.y);
		return this;
	}

	public setAll(v:number){
		this.x=v;
		this.y=v;
		return this;
	}

	public set(axis:|'x'|'y', v:number):this;
	public set(x:number, y:number):this;
	public set(arg0:number|'x'|'y', arg1:number){
		if(typeof(arg0)==='string'){
			this[arg0]=arg1;
		}else{
			super.set(arg0,arg1);
		}
		return this;
	}

	public neg(){
		this.x*=-1;
		this.y*=-1;
		return this;
	}

	public inv(){
		this.x=1/this.x;
		this.y=1/this.y;
		return this;
	}

	public abs(){
		return this.applyFunc(Math.abs);
	}

	public addScaled(that:Vec2Like, scale:number){
		this.x+=that.x*scale;
		this.y+=that.y*scale;
		return this;
	}

	public mul(that:Vec2Like){
		this.x*=that.x;
		this.y*=that.y;
		return this;
	}

	public div(that:Vec2Like){
		this.x/=that.x;
		this.y/=that.y;
		return this;
	}

	public mod(that:Vec2Like){
		this.x%=that.x;
		this.y%=that.y;
		return this;
	}

	public lerp(that:Vec2Like, f:number){
		this.x+=(that.x-this.x)*f;
		this.y+=(that.y-this.y)*f;
		return this;
	}

	public mean(that:Vec2Like){
		this.x=(that.x+this.x)/2;
		this.y=(that.y+this.y)/2;
		return this;
	}

	public mix(that:Vec2Like, f:Vec2Like){
		this.x+=(that.x-this.x)*f.x;
		this.y+=(that.y-this.y)*f.y;
		return this;
	}

	public sum(a:Vec2Like, b:Vec2Like){
		this.x=a.x+b.x;
		this.y=a.y+b.y;
		return this;
	}

	public diff(a:Vec2Like, b:Vec2Like){
		this.x=a.x-b.x;
		this.y=a.y-b.y;
		return this;
	}

	public translate(x:number, y=x){
		this.x+=x;
		this.y+=y;
		return this;
	}

	public scale(x:number, y=x){
		this.x*=x;
		this.y*=y;
		return this;
	}

	public invScale(x:number, y=x){
		this.x/=x;
		this.y/=y;
		return this;
	}

	public frac(){
		this.x%=1;
		this.y%=1
		return this;
	}

	public lenSq(){
		return this.x**2+this.y**2;
	}

	public len(){
		return Math.sqrt(this.x**2+this.y**2);
	}

	public nrm(){
		let l=this.len();
		if(l>0)
			this.scale(1/l);
		return this;
	}

	public distToSq(that:Vec2Like){
		return (this.x-that.x)**2+(this.y-that.y)**2;
	}

	public distTo(that:Vec2Like){
		return Math.sqrt(this.distToSq(that));
	}

	public distToSqXY(that:Vec2Like){
		return this.distToSq(that);
	}

	public distToXY(that:Vec2Like){
		return this.distTo(that);
	}

	public eq(that:Vec2Like){
		return this.x===that.x && this.y===that.y;
	}

	public isValid(){
		return isValidNumber(this.x) && isValidNumber(this.y);
	}

	public isFinite(){
		return isFiniteNumber(this.x) && isFiniteNumber(this.y);
	}

	public rotate(angle:number){
		const c=Math.cos(angle);
		const s=Math.sin(angle);
		const x=this.x;
		const y=this.y;
		this.x=x*c-y*s;
		this.y=x*s+y*c;
		return this;
	}

	public rotate90(){
		//[v.x,v.y]=[-v.y,v.x];
		const tmp=this.x;
		this.x=-this.y;
		this.y=tmp;
		return this;
	}

	public azimuth():number|undefined;
	public azimuth(azimuth:number):this
	public azimuth(azimuth?:number):number|undefined|this{
		return Vec.azimuth(this,azimuth);
	}
	
	// public isNaN(){
	// 	return isNaN(this.x) || isNaN(this.y);
	// }

	// public lengthXY(){
	// 	return this.len();
	// }

	// public subXY(that:Vec2Like){
	// 	return this.sub(that);
	// }

	// public addXY(that:Vec2Like){
	// 	return this.add(that);
	// }

	// public distToXY(v:Vec2Like){
	// 	return this.distTo(v);
	// }

	// public distanceToSq(v:Vec2Like){
	// 	return this.distToSq(v);
	// }
}

export interface Vec2{
	add(that:Vec2Like):this;
	clamp(min:Vec2Like, max:Vec2Like):this;
	copy(that:Vec2Like):this;
	dot(that:Vec2Like):number;
	lerp(that:Vec2Like, f:number):this;
	max(that:Vec2Like):this;
	min(that:Vec2Like):this;
	sub(that:Vec2Like):this;
	toArray<T extends ArrayLike<number>>(array:T, offset?:number):T;
	toArray():[number,number];
}

export namespace Vec2{
	export function isLike(v:any):v is Vec2Like{
		return typeof(v)==='object' && 'x' in v && 'y' in v;
	}

	export function fromArray(array:ArrayLike<number>, offset?:number){
		return new Vec2().fromArray(array,offset);
	}

	export function from(src:ArrayLike<number>|Vec2Like){
		if('x' in src)
			return new Vec2(src.x,src.y);
		return fromArray(src);
	}

	export function fromAzimuth(azimuth:number):Vec2{
		return new Vec2(1,0).azimuth(azimuth);
	}
}
