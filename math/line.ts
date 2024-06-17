import { Circle } from "./circle";
import { PlaneRange } from "./plane-range";
import { Sphere } from "./sphere";
import { VecLike,Vec as _Vec } from "./vec";

export interface LineLike<Point extends _Vec=_Vec>{
	a:Point;
	b:Point;
}

export abstract class Line<Vec extends _Vec,Point extends Vec>{
	public constructor(
		a:Point,
		b:Point,
	){
		this.a=a;
		this.b=b;
	}

	public a:Point;
	public b:Point;

	protected abstract tmpVecA():Vec;
	protected abstract tmpVecB():Vec;
	protected abstract newVec():Vec;

	protected newP():Point{
		return new (<any>this.a.constructor)();
	}

	public clone():this{
		return new (<any>this.constructor)(this.a.clone(),this.b.clone());
	}

	public *[Symbol.iterator](){
		yield this.a;
		yield this.b;
	}
	
	public set(a:Point, b:Point){
		this.a=a;
		this.b=b;
		return this;
	}

	public copy(that:{a:Point,b:Point}){
		this.a.copy(that.a);
		this.b.copy(that.b);
		return this;
	}
	
	public equals(that:Line<Vec,Vec>){
		return this.a.eq(that.a) && this.b.eq(that.b);
	}

	public count(){
		return 2;
	}

	public at(i:number){
		if(i<0)
			i+=2;
		if(i===0)
			return this.a;
		if(i===1)
			return this.b;
		return undefined;
	}

	public atDist(dist:number, out=this.newP()){
		if(dist<=0)
			return out.copy(this.a);
		const lenSq=this.lenSq();
		const distSq=dist*dist;
		if(distSq>=lenSq)
			return out.copy(this.b);
		return out.copy(this.a).lerp(this.b,dist/Math.sqrt(lenSq));
	}

	public atIndex(i:number):Point;
	public atIndex<T extends Vec>(i:number, out:T):T;
	public atIndex(i:number, out:Vec=this.newP()){
		if(i<=0)
			return out.copy(this.a);
		if(i>=1)
			return out.copy(this.b);
		return out.copy(this.a).lerp(this.b,i);
	}

	public len(){
		return this.a.distTo(this.b);
	}
	
	public lenSq(){
		return this.a.distToSq(this.b);
	}
	
	public delta(out=this.newVec()){
		return out.diff(this.b,this.a);
	}

	public reverse(){
		[this.a,this.b]=[this.b,this.a];
		return this;
	}

	public dir(out=this.newVec()){
		out.diff(this.b,this.a).nrm();
		return out;
	}

	public towardsA(out=this.newVec()){
		return this.dir(out);
	}

	public towardsB(out=this.newVec()){
		out.diff(this.b,this.a).nrm();
		return out;
	}

	public planeRange(){
		const nrm=this.dir();
		return new PlaneRange(nrm,nrm.dot(this.a),nrm.dot(this.b));
	}

	public distOf(p:Vec){
		const v=this.dir(this.tmpVecA());
		return v.dot(p)-v.dot(this.a);
	}

	public indexOf(p:Vec){
		const v=this.dir(this.tmpVecA());
		const dotA=v.dot(this.a);
		const dotB=v.dot(this.b);
		return (v.dot(p)-dotA)/(dotB-dotA);
	}

	public closestIndexToPoint(p:VecLike){
		const pa=this.tmpVecA().diff(p,this.a);
		const ba=this.tmpVecB().diff(this.b,this.a);
		if(ba.z!==undefined && p.z===undefined)
			ba.z=0;
		const baDot=ba.dot(ba);
		if(baDot===0)
			return 0;
		return ba.dot(pa)/baDot;
	}

	public distToPointSq(p:VecLike){
		let index=this.closestIndexToPoint(p);
		index=Math.min(index,1);
		index=Math.max(index,0);
		return this.atIndex(index,this.tmpVecA()).distToSq(p);
	}

	public distToPoint(p:VecLike){
		return Math.sqrt(this.distToPointSq(p));
	}
	
	public closestPointToPoint<Out extends Vec>(p:VecLike, out:Out):Out{
		let index=this.closestIndexToPoint(p);
		index=Math.min(index,1);
		index=Math.max(index,0);
		return this.atIndex(index,out);
	}

	public closestPoint(focal:VecLike):Point;
	public closestPoint<Out extends Vec>(focal:VecLike, out:Out):Out;
	public closestPoint(focal:VecLike, out:Vec=this.newP()){
		return this.closestPointToPoint(focal,out);
	}

	public intersectionsWithCircleLike(
		circle:Circle|Sphere,
		inclusive:boolean,
	){
		const cc=circle.center;
		const cr=circle.radius;
		const {a,b}=this;

		const ab=a.distTo(b);
		const v=this.tmpVecA().diff(b,a).invScale(ab);
		const t=v.dot(this.tmpVecB().diff(cc,a));
		const e=this.tmpVecB().copy(v).scale(t).add(a);
		const ec=e.distTo(cc);

		const intersections:Vec[]=[];
		if(ec<cr){
			// line intersects the circle
			// distance from t to intersection
			const dt= Math.sqrt( cr*cr -ec*ec);

			if((inclusive && t-dt>=0) || (!inclusive && t-dt>0))
				intersections.push(v.clone().scale(t-dt).add(a));
			if((inclusive && t+dt<=ab) || (!inclusive && t+dt<ab))
				intersections.push(v.clone().scale(t+dt).add(a));
		}else if(ec===cr && inclusive){
			// line is tangent, e is the intersection
			intersections.push(e)
		}

		return intersections;
	}	
}
