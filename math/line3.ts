import { Limit } from './limit';
import { Line } from './line';
import { Plane } from './plane';
import { Ray3 } from './ray3';
import { Sphere } from './sphere';
import { Triangle3 } from './triangle3';
import { Vec3 } from './vec3';

const tmpV3A=new Vec3();
const tmpV3B=new Vec3();
const tmpV3C=new Vec3();
const tmpV3D=new Vec3();
const tmpV3E=new Vec3();
let tmpRay3:Ray3;

export class Line3<P extends Vec3=Vec3> extends Line<Vec3,P>{
	public constructor(
		a=<P>new Vec3(),
		b=<P>new Vec3(),
	){
		super(a,b);
	}

	protected tmpVecA(){
		return tmpV3A;
	}

	protected tmpVecB(){
		return tmpV3B;
	}

	protected newVec(){
		return new Vec3();
	}

	protected asTmpRay(){
		return (tmpRay3??=new Ray3()).fromPoints(this.a,this.b);
	}

	public distOfPlane(that:Plane){
		this.asTmpRay().distOfPlane(that);
	}

	public indexOfPlane(that:Plane|Limit){
		const dotA=that.normal.dot(this.a);
		const dotB=that.normal.dot(this.b);
		return (that.distanceFromOrigin()-dotA)/(dotB-dotA);
	}
	
	public intersectPlane(that:Plane|Limit, out?:P){
		const i=this.indexOfPlane(that);
		if(i<0 || 1<i)
			return null;
		if(out)
			return this.atIndex(i,out);
		return this.atIndex(i);
	}

	public intersectLimit(that:Limit, out?:P){
		return this.intersectPlane(that,out);
	}

	public intersectTriangle(that:Triangle3){
		const ray=this.asTmpRay();
		const p=ray.intersectTriangle(that.a,that.b,that.c,false,new Vec3());
		if(p){
			const dot=ray.dir.dot(p);
			if(ray.dir.dot(this.a)<=dot && dot<=ray.dir.dot(this.b))
				return p;
		}
		return null;
	}

	public intersect(that:Plane|Limit, out?:P){
		return this.intersectPlane(that,out);
	}

	public intersectionsWithSphere(sphere:Sphere, inclusive:boolean){
		return this.intersectionsWithCircleLike(sphere,inclusive);
	}

	public closestPointsWithLine(that:Line3){
		const aDir=tmpV3A.diff(this.b,this.a);
		const bDir=tmpV3B.diff(that.b,that.a);

		const aLength=aDir.len();
		aDir.divideScalar(aLength);

		const bLength=bDir.len();
		bDir.divideScalar(bLength);

		const nv=tmpV3C.copy(aDir).cross(bDir);
		const na=tmpV3D.copy(aDir).cross(nv).normalize();
		const nb=tmpV3E.copy(bDir).cross(nv).normalize();

		let da=tmpV3C.diff(that.a,this.a).dot(nb)/aDir.dot(nb);
		da=da<0?0:(da>aLength?aLength:da);
		let db=tmpV3C.diff(this.a,that.a).dot(na)/bDir.dot(na);
		db=db<0?0:(db>bLength?bLength:da);
		const ptA=this.a.clone().addScaledVector(aDir,da);
		const ptB=that.a.clone().addScaledVector(bDir,db);

		return {
			a: {
				point: ptA,
				dist: da,
				index: da/aLength,
			},
			b: {
				point: ptB,
				dist: db,
				index: db/bLength,
			},
		};
	}	
}
