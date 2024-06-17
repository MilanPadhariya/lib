import * as three from 'three';
import { Box } from './box';
import { VecLike } from './vec';
import { Vec2 } from './vec2';
import { Vec3 } from './vec3';

const tmpV3A=new Vec3();
const tmpV2A=new Vec2();

export class Box3 extends three.Box3 implements Box<Vec3>{
	min:Vec3;
	max:Vec3;

	constructor(min=new Vec3(Infinity,Infinity,Infinity), max=new Vec3(-Infinity,-Infinity,-Infinity)){
		super(min,max);
	}

	public setEmpty(){
		this.makeEmpty();
		return this;
	}

	public fromArray(array:number[]){
		if(array[0]!==undefined)
			this.min.x=array[0];
		if(array[1]!==undefined)
			this.min.y=array[1];
		if(array[2]!==undefined)
			this.min.z=array[2];
		if(array[3]!==undefined)
			this.max.x=array[3];
		if(array[4]!==undefined)
			this.max.y=array[4];
		if(array[5]!==undefined)
			this.max.z=array[5];
		return this;
	}

	public toArray(){
		const out=<[number,number,number,number,number,number]>[0,0,0,0,0,0];
		this.min.toArray(out,0);
		this.max.toArray(out,3);
		return out;
	}

	public size(dim:'x'|'y'|'z'):number;
	public size():Vec3;
	public size<T extends Vec3>(out:T):T;
	public size(arg:Vec3|'x'|'y'|'z'=new Vec3()){
		if(typeof(arg)==='string')
			return this.max[arg]-this.min[arg];
		arg.x=this.max.x-this.min.x;
		arg.y=this.max.y-this.min.y;
		arg.z=this.max.z-this.min.z;
		return arg;
	}

	public minSize(){
		const x=this.max.x-this.min.x;
		const y=this.max.y-this.min.y;
		const z=this.max.z-this.min.z;
		if(z<x && z<y)
			return z;
		if(y<x && y<=z)
			return y;
		return x;
	}

	public maxSize(){
		const x=this.max.x-this.min.x;
		const y=this.max.y-this.min.y;
		const z=this.max.z-this.min.z;
		if(z>x && z>y)
			return z;
		if(y>x && y>=z)
			return y;
		return x;
	}

	public maxSide(){
		const x=this.max.x-this.min.x;
		const y=this.max.y-this.min.y;
		const z=this.max.z-this.min.z;
		if(z>x && z>y)
			return 'z';
		if(y>x && y>=z)
			return 'y';
		return 'x';
	}

	public center(dim:'x'|'y'|'z'):number;
	public center():Vec3;
	public center<T extends Vec3>(out:T):T;
	public center(arg:Vec3|'x'|'y'|'z'=new Vec3()){
		if(typeof(arg)==='string')
			return (this.max[arg]+this.min[arg])/2;
		arg.x=(this.max.x+this.min.x)/2;
		arg.y=(this.max.y+this.min.y)/2;
		arg.z=(this.max.z+this.min.z)/2;
		return arg;
	}

	public volume(){
		return (this.max.x-this.min.x)*(this.max.y-this.min.y)*(this.max.z-this.min.z);
	}

	public expandByPoint(point:VecLike){
		this.min.min(point);
		this.max.max(point);
		return this;
	}

	public expandByPoints(points:Iterable<VecLike>):this{
		for(const p of points)
			this.expandByPoint(p);
		return this;
	}

	public union(that:{min:VecLike,max:VecLike}){
		this.min.min(that.min);
		this.max.max(that.max);
		return this;
	}

	public containsPoint(p:VecLike):boolean{
		//inclusive on both sides, so is threejs's
		return (
			this.min.x<=p.x && p.x<=this.max.x
			&& this.min.y<=p.y && p.y<=this.max.y
			&& (p.z!==undefined && this.min.z<=p.z && p.z<=this.max.z)
		);
	}

	public distToPointSq(p:VecLike){
		if(p.z===undefined)
			tmpV2A.copy(p).clamp(this.min,this.max).distToSq(p);
		return tmpV3A.copy(p).clamp(this.min,this.max).distToSq(p);
	}

	public distToPoint(p:VecLike){
		return Math.sqrt(this.distToPointSq(p))
	}

	public intersectsBox(that:{min:VecLike,max:VecLike}){
		if(that.max.x<this.min.x || that.min.x>this.max.x)
			return false;
		if(that.max.y<this.min.y || that.min.y>this.max.y)
			return false;
		if(that.max.z!==undefined && that.min.z!==undefined && (that.max.z<this.min.z || that.min.z>this.max.z))
			return false;
		return true;
	}

	public *corners(out?:Vec3){
		if(out){
			yield out.set(this.min.x,this.min.y,this.min.z);
			yield out.set(this.max.x,this.min.y,this.min.z);
			yield out.set(this.max.x,this.max.y,this.min.z);
			yield out.set(this.min.x,this.max.y,this.min.z);

			yield out.set(this.min.x,this.min.y,this.max.z);
			yield out.set(this.max.x,this.min.y,this.max.z);
			yield out.set(this.max.x,this.max.y,this.max.z);
			yield out.set(this.min.x,this.max.y,this.max.z);
		}else{
			yield this.min.clone();
			yield new Vec3(this.max.x,this.min.y,this.min.z);
			yield new Vec3(this.max.x,this.max.y,this.min.z);
			yield new Vec3(this.min.x,this.max.y,this.min.z);

			yield new Vec3(this.min.x,this.min.y,this.max.z);
			yield new Vec3(this.max.x,this.min.y,this.max.z);
			yield this.max.clone();
			yield new Vec3(this.min.x,this.max.y,this.max.z);
		}
	}
}

export namespace Box3{
	export function fromArray(array:number[]){
		return new Box3(new Vec3(array[0],array[1],array[2]),new Vec3(array[3],array[4],array[5]));
	}

	export function fromPoints(points:Iterable<Vec3>){
		return new Box3().expandByPoints(points);
	}
}
