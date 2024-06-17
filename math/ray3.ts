import * as three from 'three';
import { Box3 } from './box3';
import { Line3 } from './line3';
import { Plane } from './plane';
import { Polygon3 } from './polygon3';
import { Sphere } from './sphere';
import { Vec3,Vec3Like } from './vec3';

const tmpV3A=new Vec3();
const tmpV3B=new Vec3();
const tmpV3C=new Vec3();
const tmpV3D=new Vec3();

export class Ray3 extends three.Ray{
	public constructor(
		org=new Vec3(),
		dir=new Vec3(1,0,0)
	){
		super(org,dir);
	}

	public readonly origin:Vec3;
	public readonly direction:Vec3;

	public get org(){
		return this.origin;
	}

	public get dir(){
		return this.direction;
	}

	public fromPoints(org:Vec3Like, towards:Vec3Like){
		this.org.copy(org);
		this.dir.copy(towards).sub(org).normalize();
		return this;
	}

	public reverse(){
		this.dir.negate();
		return this;
	}

	public distOf(p:Vec3Like){
		return this.dir.dot(p)-this.dir.dot(this.org);
	}

	public atDist(distance:number, out=new Vec3()){
		return out.copy(this.org).addScaledVector(this.dir,distance);
	}

	public closestPointToPoint(p:Vec3Like):Vec3;
	public closestPointToPoint<T extends three.Vector3>(p:Vec3Like,out:T):T;
	public closestPointToPoint(p:Vec3Like, out=new Vec3()){
		return super.closestPointToPoint(<three.Vector3>p,out);
	}

	public closestPoint(p:Vec3Like, out?:Vec3){
		const distance=Math.max(0,this.distOf(p));
		return this.atDist(distance,out);
	}

	public distToPointSq(p:Vec3Like){
		const a=this.distOf(p);
		const b=this.org.distTo(p);
		if(a<0)
			return b;
		return b*b-a*a;
	}

	public distToPoint(p:Vec3Like){
		const a=this.distOf(p);
		const b=this.org.distTo(p);
		if(a<0)
			return b;
		return Math.sqrt(this.distToPointSq(p));
	}

	public intersectPlane(plane:three.Plane):Vec3|null;
	public intersectPlane<T extends three.Vector3>(plane:three.Plane, out:T):T|null;
	public intersectPlane(plane:three.Plane, out?:three.Vector3):three.Vector3|null;
	public intersectPlane(plane:three.Plane, out?:three.Vector3){
		const t=this.distOfPlane(plane);
		if(t===undefined)
			return null;
		return this.at(t,out ?? new Vec3());
	}

	public intersectBox(box:three.Box3):Vec3|null;
	public intersectBox<T extends three.Vector3>(box:three.Box3, out?:T):T|null;
	public intersectBox(box:three.Box3, out?:three.Vector3){
		const _out=super.intersectBox(box,tmpV3A);
		if(_out)
			return out?.copy(_out) ?? _out.clone();
		return null;
	}

	public intersectSphere(sphere:three.Sphere):Vec3|null;
	public intersectSphere<T extends three.Vector3>(sphere:three.Sphere, out?:T):T|null;
	public intersectSphere(sphere:three.Sphere, out:three.Vector3=new Vec3()){
		return super.intersectSphere(sphere,out);
	}

	public intersect(plane:Plane|Box3|Sphere):Vec3;
	public intersect<T extends three.Vector3>(plane:Plane|Box3|Sphere, out:T):T|null;
	public intersect(intersector:Plane|Box3|Sphere, out?:three.Vector3):three.Vector3|null{
		if(intersector instanceof Plane)
			return this.intersectPlane(intersector,out);
		if(intersector instanceof Box3)
			return this.intersectBox(intersector,out ?? new Vec3);
		if(intersector instanceof Sphere)
			return this.intersectSphere(intersector,out ?? new Vec3);
		return null;
	}

	public intersects(intersector:Plane|Box3|Sphere){
		return !!this.intersect(intersector,tmpV3D);
	}

	public closestPointsWithRayDists(that:Ray3){
		const pa=this.org;
		const pb=that.org;
		const va=this.dir;
		const vb=that.dir;
		if(Math.abs(va.dot(vb))>0.9999999)
			return null;
		const nv=tmpV3A.copy(va).cross(vb);
		const na=tmpV3B.copy(va).cross(nv).normalize();
		const nb=tmpV3C.copy(vb).cross(nv).normalize();
		const da=tmpV3D.diff(pb,pa).dot(nb)/va.dot(nb);
		const db=tmpV3D.diff(pa,pb).dot(na)/vb.dot(na);
		return {da,db};
	}

	public closestPointsWithRay(that:Ray3):[Vec3,Vec3]|null{
		const distances=this.closestPointsWithRayDists(that);
		if(!distances)
			return null;
		const {da,db}=distances;
		if(da<0 && db<0)
			return [this.org.clone(),that.org.clone()];
		if(da<0)
			return [this.org.clone(),that.closestPointToPoint(this.org)];
		if(db<0)
			return [this.closestPointToPoint(that.org),that.org.clone()];
		return [this.atDist(da),that.atDist(db)];
	}

	public closestPointsWithLine(that:Line3):[Vec3,Vec3]|null{
		tmpRay.org.copy(that.a);
		const thatLength=that.len();
		tmpRay.dir.diff(that.b,that.a).divideScalar(thatLength);

		const distances=this.closestPointsWithRayDists(tmpRay);
		if(!distances)
			return null;
		const {da,db}=distances;
		if(da<0 && db<0)
			return [this.org.clone(),tmpRay.org.clone()];
		if(da<0)
			return [this.org.clone(),tmpRay.closestPointToPoint(this.org)];
		if(db<0)
			return [this.closestPointToPoint(that.a),that.a.clone()];
		if(db>thatLength)
			return [this.closestPointToPoint(that.b),that.b.clone()];
		return [this.atDist(da),tmpRay.atDist(db)];
	}

	public closestPointOnLine(that:Line3):Vec3|null{
		tmpRay.org.copy(that.a);
		const thatLength=that.len();
		tmpRay.dir.diff(that.b,that.a).divideScalar(thatLength);

		const distances=this.closestPointsWithRayDists(tmpRay);
		if(!distances)
			return null;
		const {da,db}=distances;
		if(db<0)
			return that.a.clone();
		if(db>thatLength)
			return that.b.clone();
		if(da<0)
			return that.closestPoint(this.org);
		return tmpRay.atDist(db);
	}

	public distToLine(that:Line3){
		const points=this.closestPointsWithLine(that);
		if(!points)
			return undefined;
		const [a,b]=points;
		return a.distTo(b);
	}

	public intersectPolygon(polygon:Polygon3){
		for(const [a,b,c] of polygon.convexTriangles()){
			if(this.intersectTriangle(a,b,c,false,tmpV3A))
				return tmpV3A.clone();
		}
		return null;
	}

	//"distOf" is the along distance
	public distOfPlane(plane:three.Plane):number|undefined{
		const denom=plane.normal.dot(this.dir);
		if(denom===0)
			return undefined;
		const t=-(this.org.dot(plane.normal)+plane.constant)/denom;
		return t;
	}
}

export interface Ray3{
	at<T extends three.Vector3>(t:number, target:T):T;
	distanceToPlane(plane:three.Plane):number;
	distanceSqToPoint(point:Vec3Like):number;
	distanceToPoint(point:Vec3Like):number;
	intersectSphere<T extends three.Vector3>(sphere:Sphere, target:T):T|null;
	intersectBox<T extends three.Vector3>(box:three.Box3, target:T):T|null;
	intersectTriangle<T extends three.Vector3>(a:three.Vector3, b:three.Vector3, c:three.Vector3, backfaceCulling: boolean, target:T):T|null;
}

const tmpRay=new Ray3();

export namespace Ray3{
	export function fromPoints(org:Vec3Like, towards:Vec3Like){
		return new Ray3().fromPoints(org,towards);
	}
}

export class TwoSidedRay3 extends Ray3{
	public distToPointSq(point:Vec3Like) {
		const directionDistance=tmpV3A.diff(point,this.org).dot(this.dir);
		tmpV3A.copy(this.dir).multiplyScalar(directionDistance).add(this.org);
		return tmpV3A.distToSq(point);
	}

	public distOfPlane(plane:three.Plane):number|undefined{
		const denom=plane.normal.dot(this.dir);
		if(denom===0)
			return undefined;
		const t=-(this.org.dot(plane.normal)+plane.constant)/denom;
		return t;
	}

	// intersectSphere(sphere:three.Sphere, target:Vec3){
	// 	tmpV3A.diff(sphere.center,this.org);
	// 	const tca=tmpV3A.dot(this.dir);
	// 	const d2=tmpV3A.dot(tmpV3A)-tca*tca;
	// 	const radius2=sphere.radius*sphere.radius;

	// 	if(d2>radius2)
	// 		return null;

	// 	const thc=Math.sqrt(radius2-d2);
	// 	// t0=first intersect point-entrance on front of sphere
	// 	const t0=tca-thc;
	// 	// t1=second intersect point-exit point on back of sphere
	// 	const t1=tca+thc;
	// 	// test to see if both t0 and t1 are behind the ray-if so, return null
	// 	if(t0<0 && t1<0)
	// 		return null;
	// 	// test to see if t0 is behind the ray:
	// 	// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
	// 	// in order to always return an intersect point that is in front of the ray.
	// 	if(t0<0)
	// 		return this.at(t1,target);

	// 	// else t0 is in front of the ray, so return the first collision point scaled by t0
	// 	return this.at(t0,target);

	// }

	//not converted
	// public intersectBox(box:Box3, out:Vec3){
	// 	let tmin:number,tmax:number,tymin:number,tymax:number,tzmin:number,tzmax:number;

	// 	const invdirx=1/this.dir.x;
	// 	const invdiry=1/this.dir.y;
	// 	const invdirz=1/this.dir.z;

	// 	const org=this.org;

	// 	if(invdirx>=0){
	// 		tmin=(box.min.x-org.x)*invdirx;
	// 		tmax=(box.max.x-org.x)*invdirx;
	// 	}else{
	// 		tmin=(box.max.x-org.x)*invdirx;
	// 		tmax=(box.min.x-org.x)*invdirx;
	// 	}

	// 	if(invdiry>=0){
	// 		tymin=(box.min.y-org.y)*invdiry;
	// 		tymax=(box.max.y-org.y)*invdiry;
	// 	}else{
	// 		tymin=(box.max.y-org.y)*invdiry;
	// 		tymax=(box.min.y-org.y)*invdiry;
	// 	}

	// 	if((tmin>tymax) || (tymin>tmax))
	// 		return null;

	// 	// These lines also handle the case where tmin or tmax is NaN
	// 	// (result of 0 * Infinity). x !== x returns true if x is NaN

	// 	if(tymin>tmin || tmin!==tmin)
	// 		tmin=tymin;

	// 	if(tymax<tmax || tmax!==tmax)
	// 		tmax=tymax;

	// 	if(invdirz>=0){
	// 		tzmin=(box.min.z-org.z)*invdirz;
	// 		tzmax=(box.max.z-org.z)*invdirz;
	// 	}else{
	// 		tzmin=(box.max.z-org.z)*invdirz;
	// 		tzmax=(box.min.z-org.z)*invdirz;
	// 	}

	// 	if((tmin>tzmax) || (tzmin>tmax))
	// 		return null;

	// 	if(tzmin>tmin || tmin!==tmin)
	// 		tmin=tzmin;

	// 	if(tzmax<tmax || tmax!==tmax)
	// 		tmax=tzmax;

	// 	//return point closest to the ray (positive side)

	// 	if(tmax<0)
	// 		return null;

	// 	return this.at(tmin>=0 ? tmin : tmax, target);

	// }
}


export namespace TwoSidedRay3{
	export function fromPoints(org:Vec3Like, towards:Vec3Like){
		return new TwoSidedRay3().fromPoints(org,towards);
	}
}
