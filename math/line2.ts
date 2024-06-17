import * as three from 'three';
import { Box2 } from 'three';
import { Circle } from './circle';
import { Line } from './line';
import { Ray2 } from './ray2';
import { Vec2,Vec2Like } from './vec2';
import { Vec3 } from './vec3';

const tmpV2A=new Vec2();
const tmpV2B=new Vec2();

export class Line2<Point extends Vec2=Vec2> extends Line<Vec2,Point>{
	public static tmpRayA:Ray2;
	public static tmpRayB:Ray2;

	public constructor();
	public constructor(a:Point,b:Point);
	public constructor(
		a:Point=<Point>new Vec2(),
		b:Point=<Point>new Vec2(),
	){
		super(a,b);
	}

	protected tmpVecA(){
		return tmpV2A;
	}

	protected tmpVecB(){
		return tmpV2B;
	}

	protected newVec(){
		return new Vec2();
	}

	public ray(){
		return new Ray2(this.a,this.dir());
	}

	public distAway(p:Vec2Like){
		const v=this.nrm(tmpV2A);
		return v.dot(p)-v.dot(this.a);
	}

	public nrm(out=this.newVec()){
		out.diff(this.b,this.a).normalize();
		[out.x,out.y]=[-out.y,out.x];
		return out;
	}

	//returns positive or negative depending on side but doesn't normalize so its not the distance like distanceAway
	public side(p:Vec2Like){
		const {a,b}=this;
		const vy=b.x-a.x;
		const vx=a.y-b.y;
		return (vx*(p.x-a.x)+vy*(p.y-a.y));
	}

	public alongAndAwayOfPoint(p:Vec2Like){
		const v=this.dir(tmpV2A);
		const along=v.dot(p)-v.dot(this.a);
		[v.x,v.y]=[-v.y,v.x];
		const away=v.dot(p)-v.dot(this.a);
		return {along,away};
	}

	public pointOfAlongAndAway(aa:{along:number, away:number}):Vec2;
	public pointOfAlongAndAway(aa:{along:number, away:number}, z:number):Vec3;
	public pointOfAlongAndAway(aa:{along:number, away:number}, z?:number){
		const v=this.dir(tmpV2A);
		const p=new Vec2().copy(this.a).addScaledVector(v,aa.along);
		[v.x,v.y]=[-v.y,v.x];
		p.addScaledVector(v,aa.away);
		if(z!==undefined)
			return new Vec3(p.x,p.y,z);
		return p;
	}

	private _intersectLine(that:Line2<Vec2>, out?:Vec2){
		const pb=this.b;
		const pa=this.a;
		const qb=that.b;
		const qa=that.a;
		const qdx=qb.x-qa.x;
		const qdy=qb.y-qa.y;
		const pdx=pb.x-pa.x;
		const pdy=pb.y-pa.y;
		// down part of intersection point formula
		const d=pdx*qdy-pdy*qdx;
		if(d===0)
			return null;

		// upper part of intersection point formula
		const u1=pb.x*pa.y-pb.y*pa.x;
		const u2=qb.x*qa.y-qb.y*qa.x;

		// intersection point formula
		const x=(u1*qdx-pdx*u2)/d;
		const y=(u1*qdy-pdy*u2)/d;

		const pDot=pdx*x+pdy*y;
		const pDotMin=pdx*pa.x+pdy*pa.y;
		const pDotMax=pdx*pb.x+pdy*pb.y;
		if(!(pDotMin<pDot && pDot<pDotMax))
			return null;
		const qDot=qdx*x+qdy*y;
		const qDotMin=qdx*qa.x+qdy*qa.y;
		const qDotMax=qdx*qb.x+qdy*qb.y;
		if(!(qDotMin<qDot && qDot<qDotMax))
			return null;

		out??=new Line2.Intersection();
		out.x=x;
		out.y=y;
		return out;
	}

	public intersectsRay(that:Ray2):boolean{
		return that.intersects(this);
	}

	public intersectsLine(that:Line2<Vec2>):boolean{
		return !!this._intersectLine(that,tmpV2A);
	}

	public intersectsBox(box:three.Box2):boolean{
		if(this.a.x<=box.min.x && this.b.x<=box.min.x)
			return false;
		if(this.a.x<=box.min.y && this.b.y<=box.min.y)
			return false;
		if(this.a.x>box.max.x && this.b.x<=box.max.x)
			return false;
		if(this.a.y>box.max.y && this.b.y<=box.max.y)
			return false;

		if(this.a.equals(this.b))
			return box.containsPoint(this.a);

		const normal=tmpV2A.copy(this.b).sub(this.a);
		[normal.x,normal.y]=[normal.y,-normal.x];
		const baseDp=normal.dot(this.a);
		const dp=[
			normal.x*box.min.x+normal.y*box.min.y-baseDp,
			normal.x*box.min.x+normal.y*box.max.y-baseDp,
			normal.x*box.max.x+normal.y*box.min.y-baseDp,
			normal.x*box.max.x+normal.y*box.max.y-baseDp,
		];
		if(
			dp[0]*dp[1]>=0
			&& dp[0]*dp[2]>=0
			&& dp[0]*dp[3]>=0
		)
			return false;

		return true;
	}

	public intersects(that:Ray2|Line2|three.Box2):boolean{
		if(that instanceof Ray2)
			return this.intersectsRay(that);
		if(that instanceof Line2)
			return this.intersectsLine(that);
		return this.intersectsBox(that);
	}

	public intersectRay(that:Ray2, _out?:Vec2){
		const out=that.intersectLine(this,_out);
		if(out instanceof Line2.Intersection){
			[out.distanceA,out.distanceB]=[out.distanceB,out.distanceA];
			out.indexA=out.distanceA/this.len();
		}else if(out){
			delete (<any>out).distanceA;
			delete (<any>out).distanceB;
		}
		return out;
	}

	public intersectLine(that:Line2<Vec2>, _out?:Vec2){
		const out=this._intersectLine(that,_out);
		if(out instanceof Line2.Intersection){
			let v=this.dir(tmpV2A);
			let dotMin=v.dot(this.a);
			let len=v.dot(this.b)-dotMin;
			out.distanceA=(v.dot(out)-dotMin)/len;
			out.indexA=out.distanceA/len;

			v=that.dir(tmpV2A);
			dotMin=v.dot(that.a);
			len=v.dot(that.b)-dotMin;
			out.distanceB=(v.dot(out)-dotMin)/len;
			out.indexB=out.distanceB/len;
		}
		return out;
	}

	public intersection(that:Ray2|Line2<Vec2>):Line2.Intersection;
	public intersection<Out extends Vec2>(that:Ray2|Line2<Vec2>, out:Out):Out;
	public intersection(that:Ray2|Line2<Vec2>, out?:Vec2){
		if(that instanceof Ray2)
			return this.intersectRay(that,out);
		return this.intersectLine(that,out);
	}

	public intersector(
		paInclusive:boolean,
		pbInclusive:boolean,
		qaInclusive:boolean,
		qbInclusive:boolean,
	){
		const pb=this.b;
		const pa=this.a;
		const pdx=pb.x-pa.x;
		const pdy=pb.y-pa.y;
		const pDotMin=pdx*pa.x+pdy*pa.y;
		const pDotMax=pdx*pb.x+pdy*pb.y;

		const pBox=new Box2().setFromPoints([pa,pb]);
		return (that:Line2<Vec2>, out?:Vec2)=>{
			const qb=that.b;
			const qa=that.a;
			if(qa.x<pBox.min.x && qb.x<pBox.min.x)
				return null;
			if(pBox.max.x<qa.x && pBox.max.x<qb.x)
				return null;
			if(qa.y<pBox.min.y && qb.y<pBox.min.y)
				return null;
			if(pBox.max.y<qa.y && pBox.max.y<qb.y)
				return null;

			const qdx=qb.x-qa.x;
			const qdy=qb.y-qa.y;
			const d=pdx*qdy-pdy*qdx;
			if(d===0)
				return null;

			const u1=pb.x*pa.y-pb.y*pa.x;
			const u2=qb.x*qa.y-qb.y*qa.x;
			const x=(u1*qdx-pdx*u2)/d;
			const y=(u1*qdy-pdy*u2)/d;

			const pDot=pdx*x+pdy*y;
			if((paInclusive && pDot<pDotMin) || (!paInclusive && pDot<=pDotMin))
				return null;
			if((pbInclusive && pDotMax<pDot) || (!pbInclusive && pDotMax<=pDot))
				return null;

			const qDotMin=qdx*qa.x+qdy*qa.y;
			const qDotMax=qdx*qb.x+qdy*qb.y;
			const qDot=qdx*x+qdy*y;
			if((qaInclusive && qDot<qDotMin) || (!qaInclusive && qDot<=qDotMin))
				return null;
			if((qbInclusive && qDotMax<qDot) || (!qbInclusive && qDotMax<=qDot))
				return null;

			out??=new Vec2();
			out.set(x,y);
			return out;
		}
	}

	public intersectionsWithCircle(circle:Circle, inclusive:boolean){
		return this.intersectionsWithCircleLike(circle,inclusive);
	}

	public zigZag(zigZagStep:number){
		const n=this.nrm(tmpV2A);
		const stepCount=Math.round(this.len()/zigZagStep);
		const out:Vec2[]=[];
		for(let i=1;i<=stepCount;++i){
			let dir=(i%2)*2-1
			let f=(i-0.5)/stepCount;
			out.push(this.atIndex(f).addScaledVector(n,dir*zigZagStep/2));
			f=i/stepCount;
			out.push(this.atIndex(f));
		}
		return out;
	}
}

export namespace Line2{
	export class Intersection extends Vec2{
		distanceA:number;
		distanceB:number;
		indexA:number;
		indexB:number;
	}
}

// let lineA=new Line2(new Vec2(-100,0),new Vec2(100,0));
// let lineB=new Line2(new Vec2(0,-100),new Vec2(0,100));
// console.info('testA',lineA.intersection(lineB));
// lineA=new Line2(new Vec2(-100,0),new Vec2(100,0));
// lineB=new Line2(new Vec2(0,-100),new Vec2(0,-1));
// console.info('testB',lineA.intersection(lineB));
// lineA=new Line2(new Vec2(-100,0),new Vec2(100,0));
// lineB=new Line2(new Vec2(-10,-100),new Vec2(10,10));
// console.info('testC',lineA.intersection(lineB));