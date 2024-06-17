import { Line2 } from './line2';
import { PlaneRange } from './plane-range';
import { Vec2,Vec2Like } from './vec2';

const tmpV2A=new Vec2();
const tmpV2B=new Vec2();

export class Ray2{
	public constructor(
		public org=new Vec2(),
		public dir=new Vec2(),
	){
	}

	protected minDist(){
		return 0;
	}

	public fromPoints(org:Vec2Like, towards:Vec2Like){
		this.org.copy(org);
		this.dir.copy(towards).sub(org).normalize();
		return this;
	}

	public nrm(out=new Vec2()){
		out.x=-this.dir.y;
		out.y=this.dir.x;
		return out;
	}

	public distOf(p:Vec2Like){
		return this.dir.dot(p)-this.dir.dot(this.org);
	}

	public atDist(distance:number, out=new Vec2()){
		return out.copy(this.org).addScaledVector(this.dir,distance);
	}

	public closestPoint(p:Vec2Like, out?:Vec2){
		const distance=Math.max(0,this.distOf(p));
		return this.atDist(distance,out);
	}

	public distToPointSq(p:Vec2Like){
		const a=this.distOf(p);
		const b=this.org.distTo(p);
		if(a<0)
			return b;
		return b*b-a*a;
	}

	public distToPoint(p:Vec2Like){
		const a=this.distOf(p);
		const b=this.org.distTo(p);
		if(a<0)
			return b;
		return Math.sqrt(this.distToPointSq(p));
	}

	protected _intersectRayAtDist(that:Ray2){
		const normal=this.nrm(tmpV2B);
		const cos=this.dir.dot(that.dir);
		const sin=normal.dot(that.dir);
		if(sin===0)
			return undefined;

		const delta=tmpV2A.copy(that.org).sub(this.org);
		const distanceAway=normal.dot(delta);
		const distAlongThis=this.dir.dot(delta)-distanceAway*cos/sin;
		return distAlongThis;
	}

	protected _intersectRay(
		that:Ray2,
		minDistThis:number,
		maxDistThis:number,
		minDistThat:number,
		maxDistThat:number,
		out?:Ray2.Intersection,
	){
		const atDistThis=this._intersectRayAtDist(that);
		if(!atDistThis || atDistThis<minDistThis || maxDistThis<atDistThis)
			return null;
		
		const _out=this.atDist(atDistThis,tmpV2A);
		const atDistThat=that.distOf(_out);
		if(atDistThat<minDistThat || maxDistThat<atDistThat)
			return null;

		if(out)
			out.copy(_out);
		else
			out=_out.clone();
		out.distanceA=atDistThis;
		out.distanceB=atDistThat;
		return out;
		// return this._intersection(line,out,maxDistance,false);
	}

	public intersectRay(that:Ray2, out?:Ray2.Intersection){
		return this._intersectRay(that,this.minDist(),Infinity,that.minDist(),Infinity,out);
	}

	public intersectLine(that:Line2, out?:Ray2.Intersection){
		tmpRay.org.copy(that.a);
		that.dir(tmpRay.dir);
		return this._intersectRay(tmpRay,this.minDist(),Infinity,0,tmpRay.distOf(that.b),out);
	}

	public intersection(that:Ray2|Line2):Ray2.Intersection;
	public intersection<Out extends Vec2>(that:Ray2|Line2<Vec2>, out:Out):Out;
	public intersection(that:Ray2|Line2, out?:Ray2.Intersection){
		if(that instanceof Line2)
			return this.intersectLine(that,out);
		return this.intersectRay(that,out);
	}

	public intersects(that:Line2){
		tmpRay.org.copy(that.a);
		that.dir(tmpRay.dir);

		const atDistThis=this._intersectRayAtDist(tmpRay);
		if(atDistThis===undefined || atDistThis<this.minDist())
			return false;
		
		const _out=this.atDist(atDistThis,tmpV2A);
		const atDistThat=that.distOf(_out);
		const minDistThat=0;
		const maxDistThat=tmpRay.distOf(that.b);
		if(atDistThat<minDistThat || maxDistThat<atDistThat)
			return false;
		return true;
	}

	public planeRange(){
		const nrm=this.dir
		return new PlaneRange(nrm,nrm.dot(this.org),Infinity);
	}
}

export namespace Ray2{
	export function fromPoints(org:Vec2Like, towards:Vec2Like){
		return new Ray2().fromPoints(org,towards);
	}

	export interface Intersection extends Vec2{
		distanceA?:number;
		distanceB?:number;
	}
}

const tmpRay=new Ray2();

export class TwoSidedRay2 extends Ray2{
	public constructor(
		org?:Vec2,
		dir?:Vec2,
	){
		super(org,dir);
	}

	protected minDist(){
		return -Infinity;
	}

	public distToPoint(p:Vec2Like){
		const a=this.distOf(p);
		const b=this.org.distTo(p);
		return Math.sqrt(b*b-a*a);
	}
}

export namespace TwoSidedRay2{
	export function fromPoints(org:Vec2Like, towards:Vec2Like){
		return new TwoSidedRay2().fromPoints(org,towards);
	}
}
