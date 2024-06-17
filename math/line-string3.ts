import { Box3 } from "./box3";
import { Limit } from "./limit";
import { LineString } from "./line-string";
import { Line3 } from "./line3";
import { Plane } from "./plane";
import { Vec3 } from "./vec3";

const tmpV3A=new Vec3();
const tmpLine3=new Line3<Vec3>(<any>null,<any>null);

export class LineString3<Point extends Vec3=Vec3> extends LineString<Vec3,Point>{
	constructor(
		points:Point[],
	){
		super(points);
	}

	protected tmpVec(){
		return tmpV3A;
	}

	protected newVec(){
		return new Vec3();
	}

	protected tmpLine(){
		return <Line3<Point>>tmpLine3;
	}

	protected newLine(a:Point, b:Point){
		return new Line3(a,b);
	}

	public pushFirst(p:Point){
		return this.points.unshift(p);
	}

	public pushLast(p:Point){
		return this.points.push(p);
	}

	public addZ(delta:number){
		for(const p of this.points)
			p.z+=delta;
		return this;
	}

	public setZ(z:number){
		for(const p of this.points)
			p.z=z;
		return this;
	}

	public intersectionIndices(plane:Plane|Limit){
		const out:number[]=[];
		for(const [a,b,i] of this.points.pairs()){
			const ad=plane.distanceToPoint(a);
			const bd=plane.distanceToPoint(b);
			const f=(0-ad)/(bd-ad);
			if(0<=f && f<1){
				out.push(i+f);
			}
		}
		return out;
	}

	public intersections(plane:Plane|Limit){
		const out:Point[]=[];
		for(const [a,b] of this.points.pairs()){
			const ad=plane.distanceToPoint(a);
			const bd=plane.distanceToPoint(b);
			const f=(0-ad)/(bd-ad);
			if(0<=f && f<1){
				const itersection=a.clone().lerp(b,f);
				out.push(itersection);
			}
		}
		return out;
	}
}

export namespace LineString3{
	export function assembleFromLines<Point extends Vec3=Vec3>(
		_lines:LineString.AssemblableLine<Point>[],
		epsilon:number,
	){
		const box=new Box3();
		for(const line of _lines)
			box.expandByPoints(line);
		const sortAxis=box.maxSide();
		const points=LineString._assembleFromLines(_lines,epsilon,p=>p[sortAxis]);
		return points.map(points=>new LineString3(points));
	}
}
