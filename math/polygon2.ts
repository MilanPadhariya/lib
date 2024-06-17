import { triangulatePolygonToIndices } from '../triangulate';
import { Limit } from './limit';
import { LineString2 } from './line-string2';
import { Line2 } from './line2';
import { Polygon } from './polygon';
import { Ray2 } from './ray2';
import { Triangle2 } from './triangle2';
import { Vec2,Vec2Like } from './vec2';

const tmpV2A=new Vec2();
const tmpV2B=new Vec2();

export class Polygon2<Point extends Vec2=Vec2> extends Polygon<Vec2,Point>{
	constructor(
		points:Point[]=[],
	){
		super(points);
	}

	public newLine(a:Point, b:Point){
		return new Line2(a,b);
	}

	public newTriangle(a:Point, b:Point, c:Point){
		return new Triangle2(a,b,c);
	}

	public clone():this{
		return <this>new Polygon2<Point>(this.points.map(p=>p.clone()));
	}

	public toArrays(){
		return this.points.map(p=>p.toArray());
	}

	public cutOff(limit:Limit){
		for(let i=0;i<this.points.length;){
			const a=this.points[i];
			const b=this.points[(i+1)%this.points.length];
			const aD=limit.normal.dot(a);
			const bD=limit.normal.dot(b);
			if(aD<limit.constant && limit.constant<bD){
				(<any>b)._remove=true;
				let insert=a.clone().lerp(b,(limit.constant-aD)/(bD-aD));
				this.points.splice(i+1,0,insert);
				i+=2;
			}else if(bD<limit.constant && limit.constant<aD){
				(<any>a)._remove=true;
				let insert=a.clone().lerp(b,(limit.constant-aD)/(bD-aD));
				this.points.splice(i+1,0,insert);
				i+=2;
			}else if(aD>limit.constant && bD>limit.constant){
				(<any>a)._remove=true;
				(<any>b)._remove=true;
				i+=1;
			}else{
				i+=1;
			}
		}
		this.points=this.points.filter(p=>!(<any>p)._remove);
	}

	public area(){
		if(this.points.length<3)
			return 0;
		//assumes convex and clockwise
		let area=0;
		const a=this.points[0];
		for(let i=2;i<this.points.length;++i){
			const b=this.points.at(i-1)!;
			const c=this.points.at(i)!;
			area+=Triangle2.areaSigned(a,b,c);
		}
		return area;
	}

	public shoeLaceArea(){
		// Can work for concave polygons as well
		let area = 0;
		for(let i=0; i<this.points.length; i++) {
			const j = (i+1) % this.points.length;
			area += this.points[i].x * this.points[j].y - this.points[j].x * this.points[i].y;
 		}

		return Math.abs(area/2);
	}

	public isClockwise(){
		if(this.points.length<3)
			return null;

		const end=this.points.length-1;
		let area=this.points[end].x * this.points[0].y - this.points[0].x * this.points[end].y;
		for(let i=0;i<end;++i){
			const n=i+1;
			area+=this.points[i].x*this.points[n].y - this.points[n].x*this.points[i].y;
		}
		return area>0;
	}

	public contains(p:Vec2Like){
		return Polygon2.contains(this.points,p);
	}

	public expand(expandDistance:number){
		if(expandDistance===0)
			return;
		if(this.count<3)
			return;

		const lines:{line:Line2<Point>, center:Point}[]=[];
		for(const [a,b] of this.points.pairs(true)){
			const line=new Line2(a.clone(),b.clone());
			const normal=line.nrm(tmpV2A);
			line.a.addScaledVector(normal,expandDistance);
			line.b.addScaledVector(normal,expandDistance);
			lines.push({line,center:a});
		}

		this.points=[];
		let prev=lines.at(-1)!.line;
		for(const {line: next,center} of lines){
			if(prev.b.distanceTo(next.a)<=0.01){
				prev.b.copy(next.a.lerp(prev.b,0.5));
				if(!this.points.at(-1)?.equals(next.a))
					this.points.push(next.a);
			}else if(prev.intersection(next,prev.b)){
				next.a.copy(prev.b);
				if(!this.points.at(-1)?.equals(next.a))
					this.points.push(next.a);
			}else{
				if(!this.points.at(-1)?.equals(next.a))
					this.points.push(prev.b);

				const v=prev.towardsB(tmpV2B).add(next.towardsA(tmpV2A)).normalize();
				const mid=center.clone().addScaledVector(v,expandDistance);
				if(!this.points.at(-1)?.equals(mid))
					this.points.push(mid);

				if(!this.points.at(-1)?.equals(next.a))
					this.points.push(next.a);
			}
			prev=next;
		}
	}

	public intersectionsRay(ray:Ray2, intersections:Line2.Intersection[]=[]){
		const seg=new Line2<Point>();
		let i;
		for([seg.a,seg.b,i] of this.points.pairs(true)){
			const intersection=seg.intersection(ray,new Line2.Intersection);
			if(intersection){
				intersection.indexA=i+seg.indexOf(intersection);
				intersections.push(intersection);
			}
		}
		return intersections;
	}
	
	public intersectionsLine(line:Line2, intersections:Line2.Intersection[]=[]){
		const seg=new Line2<Point>();
		let i;
		for([seg.a,seg.b,i] of this.pairs()){
			const intersection=seg.intersection(line);
			if(intersection){
				intersection.indexA=i+seg.indexOf(intersection);
				intersection.indexB=line.indexOf(intersection);
				intersections.push(intersection);
			}
		}
		return intersections;
	}

	public intersections(intersector:Ray2|Line2|LineString2, intersections:Line2.Intersection[]=[]){
		if(intersector instanceof Ray2){
			this.intersectionsRay(intersector,intersections);
		}else if(intersector instanceof Line2){
			this.intersectionsLine(intersector,intersections);
		}else{
			const line=new Line2<Vec2>();
			let i:number;
			for([line.a,line.b,i] of intersector.pairs()){
				let prevLength=intersections.length;
				this.intersectionsLine(line,intersections);
				for(let j=prevLength;j<intersections.length;++j)
					intersections[j].indexB+=i;
			}
		}
		return intersections;
	}

	public sliceOff(limit:Limit){
		const {points}=this;
		const _points:Point[]=[];
		let changed=false;
		for(let ia=0;ia<points.length;++ia){
			const ib=(ia+1)%points.length;
			const a=points[ia];
			const b=points[ib];
			const aD=limit.normal.dot(a);
			const bD=limit.normal.dot(b);
			if(aD<=limit.constant){
				_points.push(a);
			}else{
				changed=true;
			}
			if(aD<limit.constant && limit.constant<bD){
				const insert=a.clone().lerp(b,(limit.constant-aD)/(bD-aD));
				_points.push(insert);
				changed=true;
			}else if(bD<limit.constant && limit.constant<aD){
				const insert=a.clone().lerp(b,(limit.constant-aD)/(bD-aD));
				_points.push(insert);
				changed=true;
			}
		}
		
		if(changed)
			this.points=_points;
		return changed;
	}

	//this function currently can't handle multiple intersecting polygons, can't figure out how to do it without requiring specific winding order
	public polygonIntersection(that:Polygon2<Point>):Polygon2<Point>[]{
		type FP=Point&{
			_pi?:number;
			_qi?:number|null;
		};
		const pointsP=this.points;
		const pointsQ=that.points;

		const lineP=new Line2<Point>();
		const lineQ=new Line2<Point>();
		const partial:FP[]=[];
		let inside=Polygon2.contains(pointsQ,pointsP.at(0)!);
		for(const [pa,pb,pi] of pointsP.pairs(true)){
			lineP.a.copy(pa);
			lineP.b.copy(pb);
			const intersector=lineP.intersector(true,false,true,false);
			const _pa=<FP>pa.clone();
			_pa._pi=pi;
			if(inside)
				_pa._qi=null;
			partial.push(_pa);

			const intersections:FP[]=[];
			for(const [qa,qb,qi] of pointsQ.pairs(true)){
				lineQ.a.copy(qa);
				lineQ.b.copy(qb);
				const intersection=<FP>intersector(lineQ);
				if(intersection){
					const f=lineQ.indexOf(intersection);
					intersection._qi=(qi+f);
					intersection._pi=pi+lineP.indexOf(intersection);
					intersections.push(intersection);
				}
			}
			intersections.sort((u,v)=>u._pi!-v._pi!);
			partial.push(...intersections);
			if(intersections.length%2===1)
				inside=!inside;
		}
		for(let i=0;i<partial.length;){
			const p=partial[i];
			if(typeof(p._qi)==='number'){
				const qi=p._qi;
				const ei=i+partial.length;
				for(++i;i<ei;++i){
					const p=partial.atWrap(i)!;
					if(p._qi===null)
						p._qi=qi;
					else
						break;
				}
			}else
				++i;
		}

		let clipped=partial.filter(q=>'_qi' in q);
		for(let qi=0;qi<pointsQ.length;++qi){
			const q=pointsQ[qi];
			if(Polygon2.contains(partial,q)){
				const _q=<FP>q.clone();
				_q._qi=qi;
				clipped.push(_q);
			}
		}
		clipped.sort((u,v)=>u._qi!-v._qi!);

		if(clipped.length===0)
			return [];
		for(const u of clipped){
			delete u._qi;
			delete u._pi;
		}
		return [new Polygon2<Point>(clipped)];
	}

	public polygonIntersector(){
		type FP=Point&{
			_pi?:number;
			_qi?:number|null;
		};

		const pointsP=this.points;
		const lineQ=new Line2<Point>();
		const sidesP=[...pointsP.pairs(true)].map(([pa,pb,pi])=>{
			const lineP=new Line2<Point>(pa,pb);
			const intersector=lineP.intersector(true,false,true,false);
			return {pa,pb,pi,lineP,intersector};
		});
		return (that:Polygon2<Point>):Polygon2<Point>[]=>{
			const pointsQ=that.points;

			const partial:FP[]=[];
			let inside=Polygon2.contains(pointsQ,pointsP.at(0)!);
			for(const {pa,pb,pi,lineP,intersector} of sidesP){
				const _pa=<FP>pa.clone();
				_pa._pi=pi;
				if(inside)
					_pa._qi=null;
				partial.push(_pa);

				const intersections:FP[]=[];
				for(const [qa,qb,qi] of pointsQ.pairs(true)){
					lineQ.a.copy(qa);
					lineQ.b.copy(qb);
					const intersection=<FP>intersector(lineQ);
					if(intersection){
						const f=lineQ.indexOf(intersection);
						intersection._qi=(qi+f);
						intersection._pi=pi+lineP.indexOf(intersection);
						intersections.push(intersection);
					}
				}
				intersections.sort((u,v)=>u._pi!-v._pi!);
				partial.push(...intersections);
				if(intersections.length%2===1)
					inside=!inside;
			}
			for(let i=0;i<partial.length;){
				const p=partial[i];
				if(typeof(p._qi)==='number'){
					const qi=p._qi;
					const ei=i+partial.length;
					for(++i;i<ei;++i){
						const p=partial.atWrap(i)!;
						if(p._qi===null)
							p._qi=qi;
						else
							break;
					}
				}else
					++i;
			}

			let clipped=partial.filter(q=>'_qi' in q);
			for(let qi=0;qi<pointsQ.length;++qi){
				const q=pointsQ[qi];
				if(Polygon2.contains(partial,q)){
					const _q=<FP>q.clone();
					_q._qi=qi;
					clipped.push(_q);
				}
			}
			clipped.sort((u,v)=>u._qi!-v._qi!);

			if(clipped.length===0)
				return [];
			for(const u of clipped){
				delete u._qi;
				delete u._pi;
			}
			return [new Polygon2<Point>(clipped)];
		}
	
	}

	public triangulate(){
		const {points}=this;
		const indices=triangulatePolygonToIndices(points);
		return indices.map(([a,b,c])=>new Triangle2(points[a],points[b],points[c]));
	}	
}

export namespace Polygon2{
	// Algorithm - Winding number algorithm. Code reference:
	// https://gist.github.com/vlasky/d0d1d97af30af3191fc214beaf379acc

	function cross(a:Vec2Like, b:Vec2Like, c:Vec2Like):number{
		return (b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
	}

	export function contains(points:Vec2Like[], p:Vec2Like):boolean{
		let wn=0; // winding number
		for(let i=0;i<points.length;++i){
			const a=points[i];
			const b=points[(i+1)%points.length];
			if(a.y<=p.y){
				if(b.y>p.y && cross(a,b,p)>0)
					wn+=1;
			}else if(b.y<=p.y && cross(a,b,p)<0)
				wn-=1;
		}
		return wn!==0;
	}
}
