import { Ray2 } from './ray2';
import { Ray3 } from './ray3';
import { sum } from './statistics';
import { Vec2,Vec2Like } from './vec2';
import { Vec3,Vec3Like } from './vec3';

export function ray2(points:{x:number, y:number}[]){
	if(points.length<2)
		return undefined;

	const v=new Vec2(0,0);
	const tmp=new Vec2();
	for(let i=0;i<points.length;++i){
		for(let j=i+1;j<points.length;++j){
			let a=points[i];
			let b=points[j];
			tmp.copy(<any>a).sub(<any>b);
			if(v.dot(tmp)<0)
				tmp.negate();
			v.add(tmp.copy(<any>a).sub(<any>b));
		}
	}
	v.normalize();
	const centroid=new Vec2(0,0);
	for(let p of points){
		centroid.add(<any>p);
	}
	centroid.divideScalar(points.length);
	return new Ray2(centroid,v);
}

export function ray3(points:Vec3Like[]){
	if(points.length<2)
		return undefined;

	const v=new Vec3(0,0);
	const tmp=new Vec3();
	for(let i=0;i<points.length;++i){
		for(let j=i+1;j<points.length;++j){
			let a=points[i];
			let b=points[j];
			tmp.copy(a).sub(<any>b);
			if(v.dot(tmp)<0)
				tmp.negate();
			v.add(tmp.copy(<any>a).sub(<any>b));
		}
	}
	v.normalize();
	const centroid=new Vec3(0,0);
	for(let p of points){
		centroid.add(<any>p);
	}
	centroid.divideScalar(points.length);
	return new Ray3(centroid,v);
}

//gets m and b from y=m*x+b for the given points
export function lineMAndB(points:Vec2Like[]){
	if(points.length===0)
		return undefined;
	const xSum=sum(points.map(p=>p.x));
	const ySum=sum(points.map(p=>p.y));
	const xySum=sum(points.map(p=>p.x*p.y));
	const xxSum=sum(points.map(p=>p.x*p.x));
	//const yySum=sum(points.map(p=>p.y*p.y));
	const ssxx=(xxSum-(xSum*xSum/points.length));
	//const ssyy=(yySum-(ySum*ySum/points.length));
	const ssxy=(xySum-(xSum*ySum/points.length));
	const m=ssxy/ssxx;
	const b=ySum/points.length-(xSum/points.length)*m;
	return {m,b};
}
