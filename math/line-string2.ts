import { Box2 } from "./box2";
import { Limit } from "./limit";
import { LineString } from "./line-string";
import { Line2 } from "./line2";
import { Ray2 } from "./ray2";
import { Vec2 } from "./vec2";

const tmpV2A=new Vec2();
const tmpLine2=new Line2<Vec2>(tmpV2A.clone(),tmpV2A.clone());

export class LineString2<Point extends Vec2=Vec2> extends LineString<Vec2,Point>{
	constructor(
		points:Point[],
	){
		super(points);
	}

	protected tmpVec(){
		return tmpV2A;
	}

	protected newVec(){
		return new Vec2();
	}

	protected tmpLine(){
		return <Line2<Point>>tmpLine2;
	}

	protected newLine(a:Point, b:Point){
		return new Line2(a,b);
	}

	private intersectionsLine(intersector:Line2){
		const line=tmpLine2;
		const out:Line2.Intersection[]=[];
		for(const [a,b,i] of this.points.pairs()){
			line.a.copy(a);
			line.b.copy(b);
			const intersection=line.intersection(intersector);
			if(intersection){
				intersection.indexA+=i;
				out.push(intersection);
			}
		}
		return out;
	}

	private intersectionsRay(intersector:Ray2){
		const line=tmpLine2;
		const out:Ray2.Intersection[]=[];
		for(const [a,b] of this.points.pairs()){
			line.a.copy(a);
			line.b.copy(b);
			const intersection=intersector.intersection(line);
			if(intersection){
				out.push(intersection);
			}
		}
		return out;
	}

	public intersections(intersector:Line2):Line2.Intersection[];
	public intersections(intersector:Ray2):Ray2.Intersection[];
	public intersections(intersector:Line2|Ray2){
		if(intersector instanceof Ray2){
			return this.intersectionsRay(intersector);
		}
		return this.intersectionsLine(intersector);
	}

	public *perpendicularRays(){
		if(this.points.length>1){
			let ray=new Ray2(this.points[0],this.points[1].clone().sub(this.points[0]).normalize().rotate90());
			yield ray;
			for(const [a,b,c] of this.triplets()){
				ray=new Ray2(b,c.clone().sub(a).normalize().rotate90());
				yield ray;
			}
			ray=new Ray2(this.points.at(-1),this.points.at(-1)!.clone().sub(this.points.at(-2)!).normalize().rotate90());
			yield ray;
		}
		yield *[];
	}

	public sliceOff(limit:Limit){
		const {constant}=limit;
		const out:Point[]=[];
		for(const [a,b] of this.pairs()){
			const da=limit.distanceToPoint(a);
			if(da>0)
				out.push(a);
			const db=limit.distanceToPoint(b)
			if(da*db<0){
				const da=limit.normal.dot(a);
				const db=limit.normal.dot(b);
				out.push(a.clone().lerp(b,(constant-da)/(db-da)));
			}
		}
		this.points=out;
	}
}

export interface LineString2<Point extends Vec2=Vec2> extends LineString<Vec2,Point>{
	segments():Generator<Line2<Point>,void,undefined>;
}

export namespace LineString2{
	export function assembleFromLines<Point extends Vec2=Vec2>(
		_lines:LineString.AssemblableLine<Point>[],
		epsilon:number,
	){
		const box=new Box2();
		for(const line of _lines)
			box.expandByPoints(line);
		const sortAxis=box.maxSide();
		const points=LineString._assembleFromLines(_lines,epsilon,p=>p[sortAxis]);
		return points.map(points=>new LineString2(points));
	}
}
