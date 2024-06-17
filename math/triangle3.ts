import * as three from 'three';
import { Line3 } from './line3';
import { Plane } from './plane';
import { Polygon3 } from './polygon3';
import { Triangle2 } from './triangle2';
import { Vec2Like } from './vec2';
import { Vec3,Vec3Like } from './vec3';

const tmpV3A=new Vec3();
const tmpV3B=new Vec3();
const tmpLine3=new three.Line3();
const tmpPlane=new Plane();

export class Triangle3<Point extends Vec3=Vec3> extends three.Triangle{
	public constructor(
		a?:Point,
		b?:Point,
		c?:Point
	){
		super(
			a ?? new Vec3(),
			b ?? new Vec3(),
			c ?? new Vec3(),
		);
	}

	public a:Point;
	public b:Point;
	public c:Point;

	public at(i:number){
		i%=3;
		if(i<0)
			i+=3;
		switch(i){
			case 0:
				return this.a;
			case 1:
				return this.b;
			case 2:
				return this.c;
			default:
				return undefined;
		}
	}

	*[Symbol.iterator](){
		yield this.a;
		yield this.b;
		yield this.c;
	}

	public atIndex(i:number){
		i%=3;
		if(i<0)
			i+=3;
		if(i<1)
			return this.a.clone().lerp(this.b,i-0);
		if(i<2)
			return this.b.clone().lerp(this.c,i-1);
		return this.c.clone().lerp(this.a,i-2);
	}

	public area(){
		return this.getArea();
	}

	public nrm(out=new Vec3()):Vec3{
		return <Vec3>super.getNormal(out);
	}
	
	public sideAt(i:0|1|2):Line3;
	public sideAt(i:number, out?:Line3):Line3|undefined;
	public sideAt(i:number, out=new Line3()){
		i%=3;
		if(i<0)
			i+=3;
		switch(i){
			case 0:
				out.a=this.a;
				out.b=this.b;
				break;
			case 1:
				out.a=this.b;
				out.b=this.c;
				break;
			case 2:
				out.a=this.c;
				out.b=this.a;
				break;
			default:
				return undefined;
		}
		return out;
	}

	public sideLengths(){
		return [this.a.distTo(this.b),this.b.distTo(this.c),this.c.distTo(this.a)];
	}

	public sideLengthsSqr(){
		return [this.a.distToSq(this.b),this.b.distToSq(this.c),this.c.distToSq(this.a)];
	}

	public maxSide(){
		const a=this.a.distToSq(this.b);
		const b=this.b.distToSq(this.c);
		const c=this.c.distToSq(this.a);
		if(a>=b && a>=c)
			return 0;
		if(b>=c)
			return 1;
		return 2;
	}

	public minSide(){
		const a=this.a.distToSq(this.b);
		const b=this.b.distToSq(this.c);
		const c=this.c.distToSq(this.a);
		if(a<=b && a<=c)
			return 0;
		if(b<=c)
			return 1;
		return 2;
	}

	public containment(p:Vec3){
		return Triangle3.containment(this.a,this.b,this.c,p);
	}

	public containsXY(p:Vec2Like, marginOfError=0.01){
		return Triangle2.contains(this.a,this.b,this.c,p,marginOfError);
	}

	public containmentXY(p:Vec2Like){
		return Triangle2.containment(this.a,this.b,this.c,p);
	}

	public distanceFromEdgeXY(p:Vec2Like){
		return Triangle2.distanceFromEdge(this.a,this.b,this.c,p);
	}

	public zAtXY(p:Vec2Like, marginOfError?:number){
		return Triangle3.zAtXY(this.a,this.b,this.c,p,marginOfError);
	}

	public planeZAtXY(p:Vec2Like){
		const plane=tmpPlane.setFromCoplanarPoints(this.a,this.b,this.c);
		return plane.zAtXY(p);
	}

	public distToPointSq(p:Vec3){
		return this.closestPointToPoint(p,tmpV3A).distToSq(p);
	}

	public distToPoint(p:Vec3){
		return this.closestPointToPoint(p,tmpV3A).distTo(p);
	}

	public intersectionsPlane(plane:Plane){
		const intersections:Vec3[]=[];
		let intersection=plane.intersectLine(tmpLine3.set(this.a,this.b),tmpV3A);
		if(intersection)
			intersections.push(tmpV3A.clone());
		intersection=plane.intersectLine(tmpLine3.set(this.b,this.c),tmpV3A);
		if(intersection)
			intersections.push(tmpV3A.clone());
		if(intersections.length==1){
			intersection=plane.intersectLine(tmpLine3.set(this.c,this.a),tmpV3A);
			if(intersection)
				intersections.push(tmpV3A.clone());
		}
		if(intersections.length===2)
			return intersections;
		return null;
	}

	public centroid(out=new Vec3()){
		return out.set(
			(this.a.x+this.b.x+this.c.x)/3,
			(this.a.y+this.b.y+this.c.y)/3,
			(this.a.z+this.b.z+this.c.z)/3
		);
	}

	public circumcenter(){
		const {a,b,c}=this;
		const ac=tmpV3A.diff(c,a);
		const ab=tmpV3B.diff(b,a);
		const abXac=ab.clone().cross(ac);
		
		const acLenSq=ac.lengthSq();
		const abLenSq=ab.lengthSq();
		const abXacLenSq=abXac.lengthSq();
		// this is the vector from a TO the circumsphere center
		const toCircumsphereCenter=(abXac.clone().cross(ab).multiplyScalar(acLenSq).add(ac.clone().cross( abXac ).multiplyScalar(abLenSq))).divideScalar(2*abXacLenSq) ;
		//float circumsphereRadius = toCircumsphereCenter.len() ;
		
		return a.clone().add(toCircumsphereCenter);
	}

	public signedVolume(){
		const {a,b,c}=this;
		var v321=c.x*b.y*a.z;
		var v231=b.x*c.y*a.z;
		var v312=c.x*a.y*b.z;
		var v132=a.x*c.y*b.z;
		var v213=b.x*a.y*c.z;
		var v123=a.x*b.y*c.z;
		return (1.0/6.0)*(-v321+v231+v312-v132-v213+v123);

		// const crossProduct=tmpV3A.crossVectors(this.a,this.b);
		// return crossProduct.dot(this.c)/6;
	}

	public tessellate(){
		const ab=this.a.clone().mean(this.b);
		const bc=this.b.clone().mean(this.c);
		const ca=this.c.clone().mean(this.a);
		return [
			new Triangle3(ab,bc,ca),
			new Triangle3(ca,this.a,ab),
			new Triangle3(ab,this.b,bc),
			new Triangle3(bc,this.c,ca),
		];
	}

	public interpolationFactors(p:Vec3){
		const v=this.sideAt(this.maxSide()).dir();
		const points=[...this];
		const dots=points.map(p=>v.dot(p));
		let pDot=v.dot(p);
		const sidesPoints:Vec3[]=[];
		const sidesFactors:number[][]=[];
		for(let i=0;i<3;++i){
			const aDot=dots.at(i)!;
			const bDot=dots.atWrap(i+1)!;
			const f=(pDot-aDot)/(bDot-aDot);
			if(0<=f && f<=1){
				sidesPoints.push(points.at(i)!.clone().lerp(points.atWrap(i+1)!,f));
				const factors=[0,0,0];
				factors[i]=1-f;
				factors[(i+1)%3]=f;
				sidesFactors.push(factors);
				if(sidesPoints.length>=2)
					break;
			}
		}
		if(sidesPoints.length!==2)
			return null;
		const a=sidesPoints[0];
		const b=sidesPoints[1];
		v.diff(b,a);
		if(v.lengthSq()===0)
			return sidesFactors[0];
		v.normalize();
		pDot=v.dot(p);
		const aDot=v.dot(a);
		const bDot=v.dot(b);
		const f=(pDot-aDot)/(bDot-aDot);
		return sidesFactors[0].map((a,i)=>a+f*(sidesFactors[1][i]-a));
	}

	public divideByThresholds(
		values:[number,number,number],
		//must be sorted in accending order!!
		//it only returns the parts in the threshold range so if you want the areas past the threshold edges add -Inf and +Inf to the front and back of your thresholds respectively
		thresholds:number[],
	):(Polygon3<Point>&{thresholdIndex:number})[]{
		const thresholdIndices=Triangle3.indicesFromThresholds(values,thresholds);
		const thresholdPoints=thresholdIndices.map(v=>v.map(i=>this.atIndex(i)));
		const out:(Polygon3<Point>&{thresholdIndex:number})[]=[];
		for(const [thresholdIndex,points] of thresholdPoints.entries()){
			if(points.length>=3){
				const polygon=<(typeof out)[0]>new Polygon3<Point>(points);
				polygon.thresholdIndex=thresholdIndex;
				out.push(polygon);
			}
		}
		return out;
	}
}

export interface Triangle3 extends three.Triangle{
    closestPointToPoint<Target extends three.Vector3>(point:three.Vector3, target:Target):Target;
	getPlane<T extends three.Plane>(target:T):T;
}

export namespace Triangle3{
	export function area(a:Vec3Like, b:Vec3Like, c:Vec3Like){
		tmpV3A.diff(c,b);
		tmpV3B.diff(a,b);
		return tmpV3A.cross(tmpV3B).length()*0.5;
	}

	export function signedVolume(a:Vec3, b:Vec3, c:Vec3){
		// var v321=c.x*b.y*a.z;
		// var v231=b.x*c.y*a.z;
		// var v312=c.x*a.y*b.z;
		// var v132=a.x*c.y*b.z;
		// var v213=b.x*a.y*c.z;
		// var v123=a.x*b.y*c.z;
		// return (1.0/6.0)*(-v321+v231+v312-v132-v213+v123);
		const crossProduct=tmpV3A.crossVectors(a,b);
		return crossProduct.dot(c)/6;
	}

	export function columnVolume(a:Vec3, b:Vec3, c:Vec3){
		const area=Triangle2.area(a,b,c);
		return area*(a.z+b.z+c.z)/3;
	}
	
	export function signedColumnVolume(a:Vec3, b:Vec3, c:Vec3){
		const area=Triangle2.areaSigned(a,b,c);
		return area*(a.z+b.z+c.z)/3;
	}

	export function containment(a:Vec3Like, b:Vec3Like, c:Vec3Like, p:Vec3Like){
		const A=area(a,b,c);
		const A1=area(p,b,c);
		const A2=area(a,p,c);
		const A3=area(a,b,p);
		return Math.abs(A-(A1+A2+A3));
	}

	export function zAtXY(a:Vec3, b:Vec3, c:Vec3, p:Vec2Like, marginOfError=0){
		if(p.x<a.x && p.x<b.x && p.x<c.x)
			return undefined;
		if(a.x<p.x && b.x<p.x && c.x<p.x)
			return undefined;
		if(p.y<a.y && p.y<b.y && p.y<c.y)
			return undefined;
		if(a.y<p.y && b.y<p.y && c.y<p.y)
			return undefined;
		_edge1.diff(b,a);
		_edge2.diff(c,a);
		_normal.crossVectors(_edge1,_edge2);

		// Solve Q + t*D=b1*E1 + b2*E2 (Q=kDiff,D=ray dir,
		// E1=kEdge1,E2=kEdge2,N=Cross(E1,E2)) by
		//   |Dot(D,N)|*b1=sign(Dot(D,N))*Dot(D,Cross(Q,E2))
		//   |Dot(D,N)|*b2=sign(Dot(D,N))*Dot(D,Cross(E1,Q))
		//   |Dot(D,N)|*t=-sign(Dot(D,N))*Dot(Q,N)
		let DdN=_normal.z;
		let sign:number;

		if(DdN>0){
			sign=1;
		}else if(DdN<0){
			sign=-1;
			DdN=-DdN;
		}else
			return undefined;

		_diff.x=p.x-a.x;
		_diff.y=p.y-a.y;
		_diff.z=0-a.z;
		//const DdQxE2=sign*_edge2.crossVectors(_diff,_edge2).z;
		const DdQxE2=sign*crossVectorsZ(_diff,_edge2);

		// b1 < 0,no intersection
		if(DdQxE2<-marginOfError)
			return undefined;

		const DdE1xQ=sign*crossVectorsZ(_edge1,_diff);

		//b2 < 0,no intersection
		if(DdE1xQ<-marginOfError)
			return undefined;

		//b1+b2 > 1,no intersection
		if(DdQxE2+DdE1xQ-DdN>marginOfError)
			return undefined;

		const QdN=-sign*_diff.dot(_normal);
		return QdN/DdN;
	}

	export function indicesFromThresholds(
		values:[number,number,number],//must be 3, one for each point
		thresholds:number[],//must be sorted in accending order!!
	){
		const thresholdIndices:number[][]=thresholds.slice(0,thresholds.length-1).map(()=>[]);

		//the order of this loop is important to maintain the same ordering as our triangle
		for(let thi=0;thi<thresholdIndices.length;++thi){
			const tha=thresholds[thi];
			const thb=thresholds[thi+1];
			const indices=thresholdIndices[thi];

			for(let pi=0;pi<3;++pi){
				const qi=(pi+1)%3;
				const va=values[pi];
				const vb=values[qi];
				const valueDiff=vb-va;

				if(tha<=va && va<=thb)
					indices.push(pi);
				if(va<vb){
					if(va<tha && tha<vb)
						indices.push(pi+(tha-va)/valueDiff);
					if(va<thb && thb<vb)
						indices.push(pi+(thb-va)/valueDiff);
				}else if(vb<va){
					if(vb<thb && thb<va)
						indices.push(pi+(thb-va)/valueDiff);
					if(vb<tha && tha<va)
						indices.push(pi+(tha-va)/valueDiff);
				}
			}
		}
		for(const indices of thresholdIndices){
			if(indices.length<3)
				indices.length=0;
		}
		return thresholdIndices;
	}

}

const _edge1=new Vec3();
const _edge2=new Vec3();
const _normal=new Vec3();
const _diff=new Vec3();

function crossVectorsZ(a:Vec3, b:Vec3){
	return a.x*b.y-a.y*b.x;
}

