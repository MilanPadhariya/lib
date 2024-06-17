import { Line } from './line';
import { Triangle } from './triangle';
import { Vec as _Vec } from './vec';

export abstract class Polygon<Vec extends _Vec,Point extends Vec>{
	constructor(
		public points:Point[],
	){
	}

	protected newP():Point{
		return new (<any>this.points[0].constructor)();
	}

	public abstract newLine(a:Point, b:Point):Line<Vec,Point>;
	public abstract newTriangle(a:Point, b:Point, c:Point):Triangle<Point>;

	public copy(that:Polygon<Vec,Point>){
		this.points=that.points.map(p=>p.clone());
		return this;
	}

	public clear(){
		this.points.length=0;
	}

	public reverse(){
		this.points.reverse();
	}
	
	public [Symbol.iterator](){
		return this.points.values();
	}

	public at(i:number){
		return this.points.at(i%this.points.length);
	}

	public get count(){
		return this.points.length;
	}

	public length(){
		let length=0;
		for(const [a,b] of this.points.pairs(true)){
			length+=a.distTo(b);
		}
		return length;
	}

	public translate(delta:Parameters<Point['add']>[0]){
		for(const p of this)
			p.add(delta);
	}

	public pairs(){
		return this.points.pairs(true);
	}

	// public lines():Generator<Line<Vec,Point>,void,unknown>;
	// public lines<Out extends Point>(out?:Line<Point>):Generator<Line<Point>,void,unknown>;
	// public *lines(unique:boolean){
	// 	if(unique){
	// 		for(let i=0;i<this.points.length;++i){
	// 			const a=this.points[i];
	// 			const b=this.points[(i+1)%this.points.length];
	// 			yield new Line(a,b);
	// 		}
	// 	}else{
	// 	}
	// 	if(out instanceof Line){
	// 		const tmp=out;
	// 		out=(a,b)=>{
	// 			tmp.a=a;
	// 			tmp.b=b;
	// 			return tmp;
	// 		};
	// 	}else if(!out){
	// 		out=(a,b)=>this.newLine(a,b);
	// 	}
	// 	for(let i=0;i<this.points.length;++i){
	// 		const a=this.points[i];
	// 		const b=this.points[(i+1)%this.points.length];
	// 		yield out(a,b);
	// 	}
	// }

	public *crossPairs(){
		for(const p of this.points){
			for(const q of this.points){
				if(p===q)
					continue;
				yield <[Point,Point]>[p,q];
			}
		}
	}

	public convexTriangles():Generator<ReturnType<this['newTriangle']>,void,unknown>;
	public convexTriangles<T extends Triangle<Point>>(triangle?:Triangle<Point>):Generator<T,void,unknown>;
	public *convexTriangles(triangle?:Triangle<Point>){
		if(this.count<3)
			return;
		if(triangle){
			triangle.a=this.points.at(0)!;
			for(let i=2;i<this.points.length;++i){
				triangle.b=this.points.at(i-1)!;
				triangle.c=this.points.at(i)!;
				yield triangle;
			}
		}else{
			const a=this.points.at(0)!;
			for(let i=2;i<this.points.length;++i){
				const triangle=this.newTriangle(
					a,
					this.points.at(i-1)!,
					this.points.at(i)!
				);
				yield triangle;
			}
		}
	}
	
	public centroid(){
		if(this.points.length<3)
			return null;
		
		const p=this.newP().setAll(0);
		let areaSum=0;
		for(const t of this.convexTriangles()){
			const area=t.area();
			p.addScaled(t.centroid(),area);
			areaSum+=area;
		}
		p.invScale(areaSum);
		return p;
	}
}
