import * as three from 'three';

export type Vec4Like={x:number,y:number,z:number,w:number};

export class Vec4 extends three.Vector4{
	public setZero(){
		return this.set(0,0,0,0);
	}

	public mean(that:Vec4Like){
		this.x=(this.x+that.x)/2;
		this.y=(this.y+that.y)/2;
		this.z=(this.z+that.z)/2;
		this.w=(this.w+that.w)/2;
		this.setX
		return this;
	}
}

export interface Vec4{
	toArray():[number,number,number];
	toArray<T extends ArrayLike<number>>(array?:T, offset?:number):T;

	equals(v:Vec4Like):boolean;

	copy(that:Vec4Like):this;
	sub(that:Vec4Like):this;
	dot(that:Vec4Like):number;
	distanceTo(that:Vec4Like):number;
	distanceToSquared(that:Vec4Like):number;

	subVectors(a:Vec4Like, b:Vec4Like):this;
}

export namespace Vec4{
	export function fromArray(array:ArrayLike<number>, offset?:number){
		return new Vec4().fromArray(array,offset);
	}

	export function from(src:ArrayLike<number>|Vec4Like){
		if('x' in src && 'y' in src && 'z' in src && 'w' in src)
			return new Vec4(src.x,src.y,src.z,src.w);

		const v=Vec4.fromArray(src);
		return v;
	}
}
