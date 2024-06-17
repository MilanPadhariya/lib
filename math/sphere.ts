import * as three from 'three';
import { Vec3, Vec3Like } from './vec3';
import { farthestPair } from './farthest';

export class Sphere extends three.Sphere{
	public readonly center:Vec3;
	
	public constructor(center=new Vec3(), radius=0){
		super(center,radius);
	}
}

export namespace Sphere{
	export function contains(c:Vec3Like, r:number, p:Vec3Like){
		return (p.x-c.x)**2+(p.y-c.y)**2<=r*r;
	}

	export function fromPoints(points:Iterable<Vec3>){
		const farthest=farthestPair(points);
		if(!farthest)
			return null;
		return new Sphere(farthest[0].clone().mean(farthest[1]),farthest[2]/2);
	}
}
