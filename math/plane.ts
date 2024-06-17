import * as three from 'three';
import { Box3 } from './box3';
import { Line3 } from './line3';
import { Vec2,Vec2Like } from './vec2';
import { Vec3 } from './vec3';

const tmpV3A=new Vec3();

export class Plane extends three.Plane{
	public constructor(
		normal=new Vec3(1,0,0),
		constantOrPoint:number|Vec3=0
	){
		super(normal,constantOrPoint instanceof Vec3?normal.dot(constantOrPoint):constantOrPoint);
	}

	public readonly normal:Vec3;

	public setCoplanarPoint(p:Vec3){
		this.constant=-p.dot(this.normal);
		return this;
	}

	public toNormalAndPoint(){
		const point=new Vec3(0,0,-this.constant/this.normal.z);
		const normal=this.normal;
		return {normal,point};
	}

	public fromNormalAndPoint(normal:Vec3, point:Vec3){
		return this.setFromNormalAndCoplanarPoint(normal,point);
	}

	public distanceFromOrigin(){
		return -this.constant;
	}

	public coplanarPoint():Vec3;
	public coplanarPoint<T extends three.Vector3>(point:T):T;
	public coplanarPoint(point:three.Vector3=new Vec3()){
		return super.coplanarPoint(point);
	}

	public toArray(){
		return [this.normal.x,this.normal.y,this.normal.z,this.constant];
	}

	public zAtXY(p:Vec2Like){
		return -(p.x*this.normal.x+p.y*this.normal.y+this.constant)/this.normal.z;
	}

	public azimuthVector(){
		if(this.normal.x===0 && this.normal.y===0)
			return null;
		return this.normal.clone().negate().set('z',0).normalize();
	}

	public azimuth(){
		return Plane.normalToAzimuth(this.normal);
	}

	public grade(){
		return Plane.normalToGrade(this.normal);
	}

	public strike(){
		return Plane.normalToStrike(this.normal);
	}

	public dip(){
		return Plane.normalToDip(this.normal);
	}

	public distanceToBox(that:Box3){
		const distances=[
			this.normal.dot(that.min),
			this.normal.dot(tmpV3A.set(that.max.x,that.min.y,that.min.z)),
			this.normal.dot(tmpV3A.set(that.max.x,that.max.y,that.min.z)),
			this.normal.dot(tmpV3A.set(that.min.x,that.max.y,that.min.z)),

			this.normal.dot(tmpV3A.set(that.min.x,that.min.y,that.max.z)),
			this.normal.dot(tmpV3A.set(that.max.x,that.min.y,that.max.z)),
			this.normal.dot(that.max),
			this.normal.dot(tmpV3A.set(that.min.x,that.max.y,that.max.z)),
		]
		let min=distances[0];
		let max=distances[0];
		for(let i=1;i<8;++i){
			if(min>distances[i])
				min=distances[i];
			if(max<distances[i])
				max=distances[i];
		}

		min+=this.constant;
		max+=this.constant;
		if(max<=0)
			return max;
		if(min>=0)
			return min
		return 0;
	}

	public intersectionIndex(intersector:Line3):number|undefined{
		const line=intersector;
		const da=this.normal.dot(line.a);
		const db=this.normal.dot(line.b);
		if(da!==db)
			return ((-this.constant)-da)/(db-da);
		return undefined;
	}

	public intersectLine(intersector:three.Line3):Vec3|null;
	public intersectLine<Out extends Vec3>(intersector:Line3<Out>, out?:Out):Out|null;
	public intersectLine<Out extends Vec3>(intersector:three.Line3, out?:Out):Out|null;
	public intersectLine(intersector:Line3<Vec3>|three.Line3, out?:Vec3):three.Vector3|null{
		if(intersector instanceof Line3){
			//the formula here is very finicky when I used threejs's version it didn't find intersections when point was close to plane -JOHN LOCKWOOD
			const line=intersector;
			const da=this.normal.dot(line.a);
			const db=this.normal.dot(line.b);
			const constant=-this.constant;
			if(((da<=constant && constant<=db) || (db<=constant && constant<=da)) && da!==db){
				const f=(constant-da)/(db-da);
				if(out)
					out.lerpVectors(line.a,line.b,f)
				else
					out=line.a.clone().lerp(line.b,f);
				return out;
			}
			return null;
		}
		if(intersector instanceof three.Line3){
			return super.intersectLine(intersector,out ?? new Vec3());
		}
		return null;
	}

	public projectors(){
		const azimuthVector=this.azimuthVector() ?? new Vec3(1,0,0);
		const yVector=this.normal.clone().cross(azimuthVector).normalize();
		const xVector=yVector.clone().cross(this.normal).normalize();
		const origin=this.normal.clone().multiplyScalar(-this.constant);
		const to2d=(p:Vec3)=>new Vec2(xVector.dot(p),yVector.dot(p));
		const to3d=(p:Vec2)=>origin.clone().addScaledVector(xVector,p.x).addScaledVector(yVector,p.y);
		return {to2d,to3d};
	}

	public projectPoint(point:three.Vector3):Vec3;
	public projectPoint<Target extends Vec3>(point:three.Vector3, target:Target):Target;
	public projectPoint(point:three.Vector3, target=new Vec3()){
		super.projectPoint(point,target);
		return target;
	}
}

export interface Plane{
	set(normal:Vec3, constant:number):this;
	setComponents(x:number, y:number, z:number, w:number):this;
	setFromNormalAndCoplanarPoint(normal:three.Vector3, point:three.Vector3):this;
	setFromCoplanarPoints(a:three.Vector3, b:three.Vector3, c:three.Vector3):this;
	normalize():this;
	negate():this;
	projectPoint<Target extends Vec3>(point:three.Vector3, target:Target):Target;
	// intersectLine<T extends three.Vector3>(line:Line3, target:T):T|null;
	applyMatrix4(matrix:three.Matrix4, optionalNormalMatrix?:three.Matrix3):this;
	translate(offset:three.Vector3):this;
}

export namespace Plane{
	export function facing(axis:'x'|'y'|'z'){
		const n=new Vec3();
		n[axis]=1;
		return new Plane(n);
	}

	export function fromNormalAndPoint(
		normal:Vec3,
		point:Vec3,
	){
		const constant=-point.dot(normal);
		return new Plane(normal,constant);
	}

	export function normalFromAzimuthAndGrade(
		azimuth:number,
		grade:number,
	){
		const pitch=Math.PI/2-grade;
		const normal=Vec3.fromAzimuthAndPitch(azimuth,pitch);
		normal.x=-normal.x;
		normal.y=-normal.y;
		return normal;
	}

	export function fromAzimuthAndGrade(
		azimuth:number,
		grade:number,
		point:Vec3,
	){
		const normal=normalFromAzimuthAndGrade(azimuth,grade);
		return fromNormalAndPoint(normal,point);
	}

	export function normalToAzimuth(normal:Vec3){
		if(normal.x===0 && normal.y===0)
			return null;
		let a=Math.atan2(-normal.x,-normal.y);//note it is the opposite azimuth of the normal
		a=(a+Math.PI*2)%(Math.PI*2);
		return a;
	}

	export function normalToGrade(normal:Vec3){
		let z=normal.z/normal.len();
		return Math.acos(z);
	}

	export function normalToStrike(normal:Vec3){
		if(normal.x===0 && normal.y===0)
			return null;
		let {x,y}=normal;
		if(normal.z<0){
			x=-x;
			y=-y;
		}
		let a=Math.atan2(x,y);
		a-=Math.PI/2;
		a=(a+Math.PI*2)%(Math.PI*2);
		return a;
	}

	export function normalToDip(normal:Vec3){
		let z=normal.z;
		if(z<0)
			z=-z;
		return Math.acos(z/normal.len());
	}

	export function bestFit(points:Vec3[]){
		if(points.length<3)
			return null;

		const centroid=new Vec3(0,0,0);
		for(const p of points)
			centroid.add(p);
		centroid.divideScalar(points.length);

		// Calc full 3x3 covariance matrix, excluding symmetries:
		let xx=0.0; let xy=0.0; let xz=0.0;
		let yy=0.0; let yz=0.0; let zz=0.0;

		for(const p of points){
			const r=p.clone().sub(centroid);
			xx+=r.x*r.x;
			xy+=r.x*r.y;
			xz+=r.x*r.z;
			yy+=r.y*r.y;
			yz+=r.y*r.z;
			zz+=r.z*r.z;
		}

		const det_x=yy*zz-yz*yz;
		const det_y=xx*zz-xz*xz;
		const det_z=xx*yy-xy*xy;

		const det_max=Math.max(det_x, det_y, det_z);
		if(det_max<=0.0)
			return undefined;

		// Pick path with best conditioning:
		const normal=new Vec3();
		if(det_max===det_x){
			normal.x=det_x;
			normal.y=xz*yz-xy*zz;
			normal.z=xy*yz-xz*yy;
		}else if(det_max===det_y){
			normal.x=xz*yz-xy*zz;
			normal.y=det_y;
			normal.z=xy*xz-yz*xx;
		}else{
			normal.x=xy*yz-xz*yy;
			normal.y=xy*xz-yz*xx;
			normal.z=det_z;
		}
		normal.normalize();
		const dir=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
		if(dir.dot(normal)<0)
			normal.negate();
		return new Plane().setFromNormalAndCoplanarPoint(normal,centroid);
	}
}
