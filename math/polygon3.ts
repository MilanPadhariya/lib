import { triangulatePolygonToIndices } from '../triangulate';
import { Line2 } from './line2';
import { Line3 } from './line3';
import { Plane } from './plane';
import { Polygon } from './polygon';
import { Polygon2 } from './polygon2';
import { Triangle2 } from './triangle2';
import { Triangle3 } from './triangle3';
import { Vec2Like } from './vec2';
import { Vec3 } from './vec3';

const tmpV3=new Vec3();

export class Polygon3<Point extends Vec3=Vec3> extends Polygon<Vec3,Point>{
	constructor(
		points:Point[]=[]
	){
		super(points);
	}

	public newLine(a:Point, b:Point){
		return new Line3(a,b);
	}

	public newTriangle(a:Point, b:Point, c:Point){
		return new Triangle3(a,b,c);
	}

	public clone():this{
		return <this>new Polygon3(this.points.map(p=>p.clone()));
	}

	public toArrays(){
		return this.points.map(p=>p.toArray());
	}

	public containsXY(p:Vec2Like){
		return Polygon2.contains(this.points,p);
	}

	public convexArea(){
		let total=0;
		const a=this.points[0];
		for(let i=2;i<this.points.length;++i){
			const b=this.points[i-1];
			const c=this.points[i];
			total+=Triangle3.area(a,b,c);
		}
		return total;
	}

	public convexAreaXYSigned(){
		let total=0;
		const a=this.points[0];
		for(let i=2;i<this.points.length;++i){
			const b=this.points[i-1];
			const c=this.points[i];
			total+=Triangle2.areaSigned(a,b,c);
		}
		return total;
	}

	public convexVolumeSigned(){
		let total=0;
		const a=this.points[0];
		for(let i=2;i<this.points.length;++i){
			const b=this.points[i-1];
			const c=this.points[i];
			total+=Triangle3.signedVolume(a,b,c);
		}
		return total;
	}

	public convexColumnVolume(){
		let total=0;
		const a=this.points[0];
		for(let i=2;i<this.points.length;++i){
			const b=this.points[i-1];
			const c=this.points[i];
			total+=Triangle3.columnVolume(a,b,c);
		}
		return total;
	}
	
	public convexColumnVolumeSigned(){
		let total=0;
		const a=this.points[0];
		for(let i=2;i<this.points.length;++i){
			const b=this.points[i-1];
			const c=this.points[i];
			total+=Triangle3.signedColumnVolume(a,b,c);
		}
		return total;
	}

	public intersects(plane:Plane){
		const points=this.points;
		const count=this.points.length;
		const constant=-plane.constant;
		for(let i=0;i<count;++i){
			const a=points[i];
			const b=points[(i+1)%count];
			const aD=plane.normal.dot(a);
			const bD=plane.normal.dot(b);
			if(aD<constant && constant<bD)
				return true;
			else if(bD<constant && constant<aD)
				return true;
		}
		return false;
	}

	public cutThrough(
		plane:Plane,
		onSplice:(a:Point, b:Point, c:Point, i:number, f:number)=>boolean=(()=>true),
	){
		const points=this.points;
		const constant=-plane.constant;

		for(let i=0;i<points.length;){
			const a=points[i];
			const b=points[(i+1)%points.length];
			const aD=plane.normal.dot(a);
			const bD=plane.normal.dot(b);
			if(aD<constant && constant<bD){
				const f=(constant-aD)/(bD-aD);
				const insert=a.clone().lerp(b,f);
				i+=1;
				if(onSplice(a,insert,b,i,f)){
					points.splice(i,0,insert);
					i+=1;
				}else
					i-=1;
			}else if(bD<constant && constant<aD){
				const f=(constant-aD)/(bD-aD);
				const insert=a.clone().lerp(b,f);
				i+=1;
				if(onSplice(a,insert,b,i,f)){
					points.splice(i,0,insert);
					i+=1;
				}else
					i-=1;
			}else{
				i+=1;
			}
		}
	}

	public cutOff(
		plane:Plane,
		onSplice?:(a:Point, b:Point, c:Point, i:number, f:number)=>void,
	){
		const points=<(Point&{_remove?:true})[]>this.points;
		const constant=-plane.constant;

		for(let i=0;i<points.length;){
			const a=points[i];
			const b=points[(i+1)%points.length];
			const aD=plane.normal.dot(a);
			const bD=plane.normal.dot(b);
			if(aD<constant && constant<bD){
				b._remove=true;
				const f=(constant-aD)/(bD-aD);
				const insert=a.clone().lerp(b,f);
				i+=1;
				points.splice(i,0,insert);
				onSplice?.(a,insert,b,i,f);
				i+=1;
			}else if(bD<constant && constant<aD){
				a._remove=true;
				const f=(constant-aD)/(bD-aD);
				const insert=a.clone().lerp(b,f);
				i+=1;
				points.splice(i,0,insert);
				onSplice?.(a,insert,b,i,f);
				i+=1;
			}else if(aD>constant && bD>constant){
				a._remove=true;
				b._remove=true;
				i+=1;
			}else{
				i+=1;
			}
		}
		this.points=points.filter(p=>!p._remove);
	}

	public split(
		plane:Plane,
		out:Polygon3<Point>[],
		onSplice?:(a:Point, b:Point, c:Point, f:number)=>void,
	){
		const points=<(Point&{_dist?:number})[]>this.points;

		for(const p of points)
			p._dist=plane.distanceToPoint(p);

		const pointsNeg:Point[]=[];
		const pointsPos:Point[]=[];
		for(let i=0;i<points.length;++i){
			const a=points[i];
			const b=points[(i+1)%points.length];
			const aD=a._dist!;
			const bD=b._dist!;
			if(aD<=0)
				pointsNeg.push(a);
			if(0<=aD)
				pointsPos.push(a);

			if(aD<0 && 0<bD){
				const f=(0-aD)/(bD-aD);
				const insert=a.clone().lerp(b,f);
				onSplice?.(a,insert,b,f);
				pointsNeg.push(insert);
				pointsPos.push(insert);
			}else if(bD<0 && 0<aD){
				const f=(0-aD)/(bD-aD);
				const insert=a.clone().lerp(b,f);
				onSplice?.(a,insert,b,f);
				pointsNeg.push(insert);
				pointsPos.push(insert);
			}
		}

		if(pointsNeg.length>0)
			out.push(new Polygon3<Point>(pointsNeg));
		if(pointsPos.length>0)
			out.push(new Polygon3<Point>(pointsPos));

		for(const p of points)
			delete p._dist;
	}

	// public convexTriangles(){
	// 	//assumes convex
	// 	const triangle=new Triangle3(this.points.at(0),null,null);
	// 	for(let i=2;i<this.points.length;++i){
	// 		triangle.b=this.points.at(i-1);
	// 		triangle.c=this.points.at(i);
	// 		yield triangle;
	// 	}
	// }

	//this function currently can't handle multiple intersecting polygons, can't figure out how to do it without requiring specific winding order
	public polygonIntersectionXY(that:Polygon3<Point>):Polygon3<Point>[]{
		type FP=Point&{
			__pi?:number;
			__qi?:number|null;
		};
		const pointsP=this.points;
		const pointsQ=that.points;

		const lineP=new Line2();
		const lineQ=new Line2();
		const partial:FP[]=[];
		let inside=Polygon2.contains(pointsQ,pointsP.at(0)!);
		for(const [pa,pb,pi] of pointsP.pairs(true)){
			lineP.a.copy(pa);
			lineP.b.copy(pb);
			const intersector=lineP.intersector(true,false,true,false);
			const _pa=<FP>pa.clone();
			_pa.__pi=pi;
			if(inside)
				_pa.__qi=null;
			partial.push(_pa);

			const intersections:FP[]=[];
			for(const [qa,qb,qi] of pointsQ.pairs(true)){
				lineQ.a.copy(qa);
				lineQ.b.copy(qb);
				const intersection2=intersector(lineQ);
				if(intersection2){
					const f=lineQ.indexOf(intersection2);
					const intersection3=<FP>qa.clone().lerp(qb,f);
					intersection3.__qi=(qi+f);
					intersection3.__pi=pi+lineP.indexOf(intersection2);
					intersections.push(intersection3);
				}
			}
			intersections.sort((u,v)=>u.__pi!-v.__pi!);
			partial.push(...intersections);
			if(intersections.length%2===1)
				inside=!inside;
		}
		for(let i=0;i<partial.length;){
			const p=partial[i];
			if(typeof(p.__qi)==='number'){
				const qi=p.__qi;
				const ei=i+partial.length;
				for(++i;i<ei;++i){
					const p=partial.atWrap(i)!;
					if(p.__qi===null)
						p.__qi=qi;
					else
						break;
				}
			}else
				++i;
		}

		const clipped=partial.filter(q=>'__qi' in q);
		for(let qi=0;qi<pointsQ.length;++qi){
			const q=pointsQ[qi];
			if(Polygon2.contains(partial,q)){
				const _q=<FP>q.clone();
				_q.__qi=qi;
				clipped.push(_q);
			}
		}
		clipped.sort((u,v)=>u.__qi!-v.__qi!);

		if(clipped.length===0)
			return [];
		return [new Polygon3(clipped)];
	}

	public polygonIntersectorXY():((that:Polygon3<Point>)=>Polygon3<Point>[]);
	public polygonIntersectorXY(outputIndices:true):((that:Polygon3<Point>)=>Polygon3<Point&{__pi?:number;__qi?:number;}>[]);
	public polygonIntersectorXY(outputIndices=false){
		type FP=Point&{
			__pi?:number;
			__qi?:number|null;
		};

		const pointsP=this.points;
		const lineQ=new Line2();
		const sidesP=[...pointsP.pairs(true)].map(([pa,pb,pi])=>{
			const lineP=new Line2();
			lineP.a.copy(pa);
			lineP.b.copy(pb);
			const intersector=lineP.intersector(true,false,true,false);
			return {pa,pb,pi,lineP,intersector};
		});
		return (that:Polygon3<Point>):Polygon3<Point>[]=>{
			const pointsQ=that.points;

			const partial:FP[]=[];
			let inside=Polygon2.contains(pointsQ,pointsP.at(0)!);
			for(const {pa,pb,pi,lineP,intersector} of sidesP){
				const _pa=<FP>pa.clone();
				_pa.__pi=pi;
				if(inside)
					_pa.__qi=null;
				partial.push(_pa);

				const intersections:FP[]=[];
				for(const [qa,qb,qi] of pointsQ.pairs(true)){
					lineQ.a.copy(qa);
					lineQ.b.copy(qb);
					const intersection2=intersector(lineQ);
					if(intersection2){
						const f=lineQ.indexOf(intersection2);
						const intersection3=<FP>qa.clone().lerp(qb,f);
						intersection3.__qi=(qi+f);
						intersection3.__pi=pi+lineP.indexOf(intersection2);
						intersections.push(intersection3);
					}
				}
				if(intersections.length>0){
					intersections.sort((u,v)=>u.__pi!-v.__pi!);
					partial.push(...intersections);
					if(intersections.length%2===1)
						inside=!inside;
				}
			}
			for(let i=0;i<partial.length;){
				const p=partial[i];
				if(typeof(p.__qi)==='number'){
					const qi=p.__qi;
					const ei=i+partial.length;
					for(++i;i<ei;++i){
						const p=partial.atWrap(i)!;
						if(p.__qi===null)
							p.__qi=qi;
						else
							break;
					}
				}else
					++i;
			}
			let clipped=partial.filter(q=>'__qi' in q);
			for(let qi=0;qi<pointsQ.length;++qi){
				const q=pointsQ[qi];
				if(Polygon2.contains(partial,q)){
					const _q=<FP>q.clone();
					_q.__qi=qi;
					clipped.push(_q);
				}
			}
			clipped.sort((u,v)=>u.__qi!-v.__qi!);

			if(clipped.length===0)
				return [];
			if(!outputIndices){
				for(const u of clipped){
					delete u.__qi;
					delete u.__pi;
				}
			}
			return [new Polygon3(clipped)];
		}
	
	}

	public bestFitPlane(){
		return Plane.bestFit(this.points);
	}

	public triangulate(){
		const plane=this.bestFitPlane();
		if(!plane)
			return [];
		const proj=plane.projectors();
		const indices=triangulatePolygonToIndices(this.points.map(p=>proj.to2d(p)));
		const {points}=this;
		return indices.map(([a,b,c])=>new Triangle3(points[a],points[b],points[c]));
	}

	public closestPointToPoint(p: Point, out?:Point): Point{
		out??=this.newP();
		let maxDist=Number.POSITIVE_INFINITY;
		const line=new Line3<Point>();
		for([line.a,line.b] of this.pairs()){
			line.closestPoint(p,tmpV3);
			const dist=p.distanceTo(tmpV3);
			if(dist<maxDist){
				out.copy(tmpV3);
				maxDist=dist;
			}
		}

		return out;
	}
}

// let a=new Polygon3([
// 	[-60,-40],
// 	[-60, 40],
// 	[ 60, 40],
// 	[ 60,-40],
// 	[ 40,-40],
// 	[ 40, 20],
// 	[-40, 20],
// 	[-40,-40],
// ].map(p=>Vec3.from(p,0)));

// let b=new Polygon3([
// 	[-100,10],
// 	[100,10],
// 	[100,-10],
// 	[-100,-10],
// ].map(p=>Vec3.from(p,0)));

// console.info(a.polygonIntersectionXY(b));
