import { isFiniteNumber,isValidNumber } from '../number';
import * as three from 'three';
import { Vec, VecLike } from './vec';
import { Vec2,Vec2Like } from './vec2';

export type Vec3Like={x:number,y:number,z:number};

export class Vec3 extends three.Vector3 implements Vec{
	public toString(){
		return `(${this.x},${this.y},${this.z}))`;
	}

	public copy(that:VecLike){
		this.x=that.x;
		this.y=that.y;
		if(that.z!==undefined)
			this.z=that.z;
		return this;
	}

	public applyFunc(fn:(v:number)=>number):this{
		this.x=fn(this.x);
		this.y=fn(this.y);
		this.z=fn(this.z);
		return this;
	}

	public setAll(v:number){
		return this.set(v,v,v);
	}

	public set(axis:|'x'|'y'|'z', v:number):this;
	public set(x:number, y:number, z:number):this;
	public set(arg0:number|'x'|'y'|'z', arg1:number, arg2?:number){
		if(typeof(arg0)==='string'){
			this[arg0]=arg1;
		}else{
			super.set(arg0,arg1,arg2!);
		}
		return this;
	}

	public neg(){
		this.x*=-1;
		this.y*=-1;
		this.z*=-1;
		return this;
	}

	public inv(){
		this.x=1/this.x;
		this.y=1/this.y;
		this.z=1/this.z;
		return this;
	}	

	public abs(){
		return this.applyFunc(Math.abs);
	}

	public addScaled(that:VecLike, scale:number){
		this.x+=that.x*scale;
		this.y+=that.y*scale;
		if(that.z!==undefined)
			this.z+=that.z*scale;
		return this;
	}

	public add(that:VecLike){
		this.x+=that.x;
		this.y+=that.y;
		if(that.z!==undefined)
			this.z+=that.z;
		return this;
	}

	public sub(that:VecLike){
		this.x-=that.x;
		this.y-=that.y;
		if(that.z!==undefined)
			this.z-=that.z;
		return this;
	}

	public mul(that:VecLike){
		this.x*=that.x;
		this.y*=that.y;
		if(that.z!==undefined)
			this.z*=that.z;
		return this;
	}

	public div(that:VecLike){
		this.x/=that.x;
		this.y/=that.y;
		if(that.z!==undefined)
			this.z/=that.z;
		return this;
	}

	public mod(that:VecLike){
		this.x%=that.x;
		this.y%=that.y;
		if(that.z!==undefined)
			this.z%=that.z;
		return this;
	}

	public dot(that:VecLike){
		if(that.z!==undefined)
			return this.x*that.x+this.y*that.y+this.z*that.z;
		return this.x*that.x+this.y*that.y;
	}

	public min(that:VecLike){
		this.x=Math.min(this.x,that.x);
		this.y=Math.min(this.y,that.y);
		if(that.z!==undefined)
			this.z=Math.min(this.z,that.z);
		return this;
	}

	public max(that:VecLike){
		this.x=Math.max(this.x,that.x);
		this.y=Math.max(this.y,that.y);
		if(that.z!==undefined)
			this.z=Math.max(this.z,that.z);
		return this;
	}

	public mean(that:VecLike){
		this.x=(this.x+that.x)/2;
		this.y=(this.y+that.y)/2;
		if(that.z!==undefined)
			this.z=(this.z+that.z)/2;
		return this;
	}

	public mix(that:VecLike, f:VecLike){
		this.x+=(that.x-this.x)*f.x;
		this.y+=(that.y-this.y)*f.y;
		if(that.z!==undefined && f.z!==undefined)
			this.z+=(that.z-this.z)*f.z;
		return this;
	}

	public sum(a:VecLike, b:VecLike){
		this.x=a.x+b.x;
		this.y=a.y+b.y;
		this.z=(a.z ?? this.z)+(b.z ?? 0);
		return this;
	}

	public diff(a:VecLike, b:VecLike){
		this.x=a.x-b.x;
		this.y=a.y-b.y;
		if(a.z!==undefined && b.z!==undefined)
			this.z=a.z-b.z;
		else
			this.z=0;
		return this;
	}

	public translate(x:number, y=x, z=y){
		this.x+=x;
		this.y+=y;
		this.z+=z;
		return this;
	}

	public scale(x:number, y=x, z=y){
		this.x*=x;
		this.y*=y;
		this.z*=z;
		return this;
	}

	public invScale(x:number, y=x, z=y){
		this.x/=x;
		this.y/=y;
		this.z/=z;
		return this;
	}

	public frac(){
		this.x%=1;
		this.y%=1;
		this.z%=1;
		Math.hypot
		return this;
	}

	public lenSq(){
		return this.x**2+this.y**2+this.z**2;
	}

	public len(){
		return Math.sqrt(this.lenSq());
	}

	public lenSqXY(){
		return this.x**2+this.y**2;
	}

	public lenXY(){
		return Math.sqrt(this.lenSqXY());
	}

	public nrm(){
		let l=this.len();
		if(l>0)
			this.invScale(l);
		return this;
	}

	public distToSq(that:VecLike){
		let v=(this.x-that.x)**2+(this.y-that.y)**2;
		if(that.z!==undefined)
			v+=(this.z-that.z)**2;
		return v;
	}

	public distTo(that:VecLike){
		return Math.sqrt(this.distToSq(that));
	}

	public distToSqXY(that:Vec2Like){
		return (this.x-that.x)**2+(this.y-that.y)**2;
	}

	public distToXY(that:Vec2Like){
		return Math.sqrt((this.x-that.x)**2+(this.y-that.y)**2);
	}

	public eq(that:VecLike){
		return this.x===that.x && this.y===that.y && this.z===that.z;
	}

	public isValid(){
		return isValidNumber(this.x) && isValidNumber(this.y) && isValidNumber(this.z);
	}

	public isFinite(){
		return isFiniteNumber(this.x) && isFiniteNumber(this.y) && isFiniteNumber(this.z);
	}

	public toXY(){
		return new Vec2(this.x,this.y);
	}

	// public copyXY(that:Vec2Like){
	// 	this.x=that.x;
	// 	this.y=that.y;
	// 	return this;
	// }

	// public addXY(that:Vec2Like){
	// 	this.x+=that.x;
	// 	this.y+=that.y;
	// 	return this;
	// }

	// public addScaledVectorXY(that:Vec2Like, scale:number){
	// 	this.x+=that.x*scale;
	// 	this.y+=that.y*scale;
	// 	return this;
	// }

	// public subXY(that:Vec2Like){
	// 	this.x-=that.x;
	// 	this.y-=that.y;
	// 	return this;
	// }

	// public multiplyXY(that:Vec2Like){
	// 	this.x*=that.x;
	// 	this.y*=that.y;
	// 	return this;
	// }

	// public multiplyScalarXY(v:number){
	// 	this.x*=v;
	// 	this.y*=v;
	// 	return this;
	// }

	public rotate90XY(){
		//[v.x,v.y]=[-v.y,v.x];
		const tmp=this.x;
		this.x=-this.y;
		this.y=tmp;
		return this;
	}

	// public rotateXY(angle:number){
	// 	const c=Math.cos(angle);
	// 	const s=Math.sin(angle);
	// 	const x=this.x;
	// 	const y=this.y;
	// 	this.x=x*c-y*s;
	// 	this.y=x*s+y*c;
	// 	return this;
	// }

	// public rotateAroundXY(center:Vec2Like, angle:number){
	// 	const c=Math.cos(angle);
	// 	const s=Math.sin(angle);
	// 	const x=this.x-center.x;
	// 	const y=this.y-center.y;
	// 	this.x=x*c-y*s+center.x;
	// 	this.y=x*s+y*c+center.y;
	// 	return this;
	// }

	// public rotateAround(ray:{origin:Vec3,direction:Vec3}, angle:number){
	// 	this.x-=ray.org.x;
	// 	this.y-=ray.org.y;
	// 	this.z-=ray.org.z;
	// 	const m=new three.Matrix4().makeRotationAxis(ray.dir,angle);
	// 	this.applyMatrix4(m);
	// 	this.x+=ray.org.x;
	// 	this.y+=ray.org.y;
	// 	this.z+=ray.org.z;
	// 	return this;
	// }

	// public addZ(z:number){
	// 	this.z+=z;
	// 	return this;
	// }

	// public distanceToXYSq(that:Vec2Like){
	// 	return (this.x-that.x)**2+(this.y-that.y)**2;
	// }

	// public distToXY(that:Vec2Like){
	// 	return Math.sqrt((this.x-that.x)**2+(this.y-that.y)**2);
	// }

	// public distanceToSq(that:Vec3Like){
	// 	return this.distToSq(that);
	// }

	public azimuth():number|undefined;
	public azimuth(azimuth:number):this
	public azimuth(azimuth?:number):number|undefined|this{
		if(azimuth===undefined){
			if(this.x===0 && this.y===0)
				return undefined;
			return Math.atan2(this.x,this.y);
		}
		const l=Math.sqrt(this.x**2+this.y**2);
		this.x=Math.sin(azimuth)*l;
		this.y=Math.cos(azimuth)*l;
		return this;
	}

	public pitch():number|undefined;
	public pitch(pitch:number):this
	public pitch(pitch?:number):number|undefined|this{
		if(pitch===undefined){
			const l=this.len();
			if(l===0)
				return undefined;
			return Math.asin(this.z/l);
		}
		const l=this.len();
		if(l>0){
			this.invScale(l);
			const cos=Math.cos(pitch);
			this.x*=cos;
			this.y*=cos;
			this.z=Math.sin(pitch)*l;
			this.scale(l);
		}
		return this;
	}

	public azimuthAndPitch(azimuth:number, pitch:number, len?:number):this{
		len??=this.len();
		this.x=Math.sin(azimuth);
		this.y=Math.cos(azimuth);
		const cos=Math.cos(pitch);
		this.x*=cos;
		this.y*=cos;
		this.z=Math.sin(pitch);
		this.scale(len);
		return this;
	}
}

export namespace Vec3{
	export function fromArray(array:ArrayLike<number>, offset?:number){
		return new Vec3().fromArray(array,offset);
	}

	export function from(src:ArrayLike<number>|VecLike){
		// if('x' in src && 'y' in src && 'z' in src)
		// 	return new Vec3(src.x,src.y,src.z);
		if('x' in src && 'y' in src)
			return new Vec3(src.x,src.y,src.z);

		const v3=Vec3.fromArray(src);
		// if(src.length<3)
		// 	v3.z=z;
		return v3;
	}

	export function fromAzimuth(azimuth:number){
		if(typeof(azimuth)!=='number')
			return undefined;
		return new Vec3(1,0,0).azimuth(azimuth);
	}

	export function fromAzimuthAndPitch(azimuth:number, pitch:number, length=1){
		return new Vec3().azimuthAndPitch(azimuth,pitch,length);
	}

	export function toFloat32Array(_in:Vec3[]){
		const out=new Float32Array(_in.length*3);
		for(const [i,v] of _in.entries()){
			v.toArray(out,i*3);
		}
		return out;
	}
}
