import { Vec2,Vec2Like } from './vec2';
//These functions assume that +y is north and +x is east
//its also assumed input vectors are normalized

const tmpV2A=new Vec2;
const tmpV2B=new Vec2;

export function from(x:number,y:number):number;
export function from(v:Vec2Like|number[]):number;
export function from(a:Vec2Like|number[], b:Vec2Like|number[]):number;
export function from(xOrVectorOrA:Vec2Like|number[]|number, yOrB?:Vec2Like|number[]|number):number|undefined{
	let x=0,y=0;
	if(Array.isArray(xOrVectorOrA))
		xOrVectorOrA=tmpV2A.fromArray(xOrVectorOrA);
	if(Array.isArray(yOrB))
		yOrB=tmpV2B.fromArray(yOrB);
	if(typeof(xOrVectorOrA)==='number' && typeof(yOrB)==='number'){
		x=xOrVectorOrA;
		y=yOrB;
	}else if(typeof(xOrVectorOrA)==='object' && typeof(yOrB)==='object'){
		const a=xOrVectorOrA;
		const b=yOrB;
		x=b.x-a.x;
		y=b.y-a.y;
	}else if(typeof(xOrVectorOrA)==='object'){
		x=xOrVectorOrA.x;
		y=xOrVectorOrA.y;
	}else
		throw 'bad types';

	if(x===0 && y===0){
		return undefined;
	}

	const result=Math.atan2(x,y);
	return (result + Math.PI*2) % (Math.PI*2);	// 0 to 2PI
	// return Math.atan2(x,y);
}

export function toVector(aziumth:number):Vec2;
export function toVector<Target extends Vec2Like>(aziumth:number, target:Target):Target;
export function toVector(aziumth:number, target?:Vec2Like){
	if(!target)
		target=new Vec2();
	target.x=Math.sin(aziumth);
	target.y=Math.cos(aziumth);
	return target;
}

// export function toNormal(azimuth:number, grade:number, out=new Vec3()){
// 	toVector(azimuth,out);
// 	const sin=Math.sin(-grade);
// 	out.x*=sin;
// 	out.y*=sin;
// 	out.z=Math.cos(grade);
// 	return out;
// }

// export function fromNormal(normal:Vec3){
// 	const azimuthVector=new Vec2(normal.x,normal.y);
// 	const l=azimuthVector.len();
// 	if(l<1/(2**16))
// 		return {azimuth:null,grade:0};
	
// 	const azimuth=from(azimuthVector.divideScalar(l));
// 	const grade=Math.acos(normal.z);
// 	return {azimuth,grade};
// }

// export function andGradeToPlane(azimuth:number, grade:number, pivit:Vec3):Plane;
// export function andGradeToPlane<PlaneType extends Plane>(azimuth:number, grade:number, pivit:Vec3, plane:PlaneType):PlaneType;
// export function andGradeToPlane(azimuth:number, grade:number, pivit:Vec3, plane=new Plane()){
// 	toNormal(azimuth,grade,plane?.normal);
// 	if(plane){
// 		plane.constant=-plane.normal.dot(pivit);
// 	}
// 	return plane;
// }

// export function fromPlane(plane:Plane){
// 	const azimuthVector=new Vec2(plane.normal.x,plane.normal.y);
// 	const l=azimuthVector.len();
// 	if(l<1/(2**16))
// 		return {azimuth: undefined,grade:0,inclination:0};
	
// 	const azimuth=from(azimuthVector.divideScalar(l));
// 	const grade=Math.acos(plane.normal.z);
// 	return {azimuth,grade,inclination:grade};
// }

export function angleABC(a:Vec2Like, b:Vec2Like, c:Vec2Like){
	var ab = Math.sqrt(Math.pow(b.x-a.x,2)+ Math.pow(b.y-a.y,2));    
	var bc = Math.sqrt(Math.pow(b.x-c.x,2)+ Math.pow(b.y-c.y,2)); 
	var ac = Math.sqrt(Math.pow(c.x-a.x,2)+ Math.pow(c.y-a.y,2));
	return Math.acos((bc*bc+ab*ab-ac*ac)/(2*bc*ab));
}