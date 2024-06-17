import { Ray2 } from './ray2';
import { Vec2,Vec2Like } from './vec2';

export class Limit{
	public constant:number;

	public constructor(
		public normal=new Vec2(0,1),
		pointOrConstant?:Vec2Like|number
	){
		if(Vec2.isLike(pointOrConstant))
			pointOrConstant=normal.dot(pointOrConstant);
		this.constant=pointOrConstant || 0;
	}

	public clone():this{
		const that=new (<any>this.constructor)();
		return that.copy(this);
	}

	public copy(that:Limit){
		this.normal.copy(that.normal);
		this.constant=that.constant;
		return this;
	}

	public fromPoints(a:Vec2Like, b:Vec2Like){
		this.normal.copy(b).sub(a).normalize();
		[this.normal.x,this.normal.y]=[-this.normal.y,this.normal.x];
		this.constant=this.normal.dot(a);
		return this;
	}

	public setCoplanarPoint(p:Vec2Like){
		this.constant=this.normal.dot(p);
	}

    public toArray(array?:number[], offset=0){
		if(!array)
			array=[0,0,0];
		array[offset+0]=this.normal.x;
		array[offset+1]=this.normal.y;
		array[offset+2]=this.constant;
		return array;
	}

	negate(){
		this.constant*=-1;
		this.normal.negate();
		return this;
	}

	public distanceFromOrigin(){
		return this.constant;
	}

	// Returns the signed distance from the point to the normal.
	public distanceToPoint(p:Vec2Like){
		return this.normal.dot(p)-this.constant;
	}

	public closestPoint(p:Vec2, out=new Vec2()){
		out.copy(p).addScaledVector(this.normal,this.constant-this.normal.dot(p));
		return out;
	}

	public intersection(ray:Ray2, out:Vec2){
		const cos=-this.normal.dot(ray.dir);
		if(cos===0)
			return null;
		return ray.atDist(this.distanceToPoint(ray.org)/cos, out);
	}
}

export namespace Limit{
	export function fromPoints(a:Vec2Like, b:Vec2Like){
		return new Limit().fromPoints(a,b);
	}
}
