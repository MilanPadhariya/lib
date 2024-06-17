import { douglasPeuckerFilter } from "../algorithms/douglas-peucker-filter";
import { MultiMap } from "../multi-map";
import { Line } from "./line";
import { VecLike,Vec as _Vec } from "./vec";

export abstract class LineString<
Vec extends _Vec,
Point extends Vec,
>{
	constructor(
		public points:Point[],
	){
	}

	protected abstract tmpVec():Vec;
	protected abstract newVec():Vec;
	protected abstract tmpLine():Line<Vec,Vec>;
	protected abstract newLine(a:Point, b:Point):Line<Vec,Point>;

	private newOfThis(points:Point[]){
		return <this>new (Object.getPrototypeOf(this).constructor)(points);
	}

	public clone(){
		return this.newOfThis(this.points.map(p=>p.clone()));
	}

	public get count(){
		return this.points.length;
	}

	public [Symbol.iterator](){
		return this.points.values();
	}

	public len(){
		let length=0;
		for(const [a,b] of this.points.pairs())
			length+=a.distTo(b);
		return length;
	}

	public eq(that:LineString<Vec,Point>){
		if(this.points.length!==that.points.length)
			return false;
		for(const [i,p] of this.points.entries()){
			if(!p.eq(that.points[i]))
				return false;
		}
		return true;
	}

	public at(i:number){
		return this.points.at(i)!;
	}

	public first(){
		return this.points.at(0);
	}

	public last(){
		return this.points.at(-1);
	}

	public unshift(p:Point){
		return this.points.unshift(p);
	}

	public push(p:Point){
		return this.points.push(p);
	}

	public vectorAt(i:number){
		if(i<0)
			i+=this.points.length;
		const a=this.points[i];
		const b=this.points[i+1];
		if(!(a && b))
			return null;
		return this.newVec().diff(b,a).nrm();
	}

	public atDist(length:number, clamp:boolean){
		if(clamp && length<=0)
			return this.points[0].clone();
		for(const [a,b] of this.points.pairs()){
			const segLength=a.distTo(b);
			if(length<segLength){
				return a.clone().lerp(b,length/segLength);
			}else{
				length-=segLength;
			}
		}
		if(clamp)
			return this.points.at(-1)!.clone();
		const a=this.points.at(-2)!;
		const b=this.points.at(-1)!;
		const segLength=a.distTo(b);
		return a.clone().lerp(b,length/segLength);
	}

	public atIndex(index:number, clamp:true):Point;
	public atIndex(index:number, clamp:false):Point|undefined;
	public atIndex(index:number, clamp:boolean){
		if(clamp){
			if(index<0)
				index=0;
			if(index>this.points.length-1)
				index=this.points.length-1;
		}

		let i=Math.floor(index);
		if(i<0)
			return undefined;
		if(i>this.points.length-1)
			return undefined;
		const p=this.points[i].clone();
		if(i===index)
			return p;
		return p.lerp(this.points[i+1],index-i);
	}

	//grabs a section of the line string kinda like String.substring does for strings
	//except it allows fractional indexes (blending between points) and the endIndex is inclusive
	public substring(beginIndex:number, endIndex:number){
		let reverse=beginIndex>endIndex;
		if(reverse)
			[beginIndex,endIndex]=[endIndex,beginIndex];
		if(beginIndex<0)
			beginIndex=0;
		if(endIndex>this.points.length-1)
			endIndex=this.points.length-1;

		const points:Point[]=[];
		if(beginIndex===endIndex){
			points.push(this.atIndex(beginIndex,true));
		}else{
			const beginInner=Math.ceil(beginIndex);
			const endInner=Math.floor(endIndex);
			if(beginIndex<beginInner)
				points.push(this.points[beginInner-1].clone().lerp(this.points[beginInner],beginIndex%1));
			points.push(...this.points.slice(beginInner,endInner+1));
			if(endIndex>endInner)
				points.push(this.points[endInner].clone().lerp(this.points[endInner+1],endIndex%1));
		}
		if(reverse)
			points.reverse();
		return <this>new (Object.getPrototypeOf(this).constructor)(points);
	}

	public transform(transformer:(p:Point)=>Point){
		for(let i=0;i<this.points.length;++i){
			this.points[i]=transformer(this.points[i]);
		}
		return this;
	}

	public translate(delta:VecLike){
		for(const p of this.points)
			p.add(delta);
		return this;
	}

	public translateX(delta:number){
		for(const p of this.points)
			p.x+=delta;
		return this;
	}

	public translateY(delta:number){
		for(const p of this.points)
			p.y+=delta;
		return this;
	}

	public setX(x:number){
		for(const p of this.points)
			p.x=x;
		return this;
	}

	public setY(y:number){
		for(const p of this.points)
			p.y=y;
		return this;
	}

	public *segments(){
		for(const [a,b] of this.points.pairs()){
			yield this.newLine(a,b);
		}
	}

	public pairs(){
		return this.points.pairs();
	}

	public triplets(){
		return this.points.triplets();
	}

	// public lines():Generator<Line<Vec>,void,unknown>;
	// public lines<Out extends Point>(out?:Line<Vec>):Generator<Line<Vec>,void,unknown>;
	// public *lines(
	// 	out?:Line<Vec>|((a:Point, b:Point)=>Line<Vec>)
	// ):Generator<Line<Vec>,void,unknown>{
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
	// 	for(let i=1;i<this.points.length;++i){
	// 		const a=this.points[i-1];
	// 		const b=this.points[1];
	// 		yield out(a,b);
	// 	}
	// }

	public distTo(focal:VecLike){
		if(this.points.length===0)
			return undefined;
		let foundDistSq=this.points[0].distToSq(focal);
		const line=this.tmpLine();
		for([line.a,line.b] of this.points.pairs()){
			const distSq=line.distToPointSq(focal);
			if(foundDistSq>distSq)
				foundDistSq=distSq;
		}
		return Math.sqrt(foundDistSq);
	}

	public closestPoint(focal:VecLike){
		if(this.points.length===0)
			return null;
		const found=this.points[0].clone();
		let foundDistSq=found.distToSq(focal);
		const line=this.tmpLine();
		const c=this.tmpVec();
		for([line.a,line.b] of this.points.pairs()){
			line.closestPointToPoint(focal,c);
			const distSq=c.distToSq(focal);
			if(foundDistSq>distSq){
				foundDistSq=distSq;
				found.copy(c);
			}
		}
		return found;
	}

	public closestIndex(focal:VecLike){
		if(this.points.length===0)
			return null;
		let found=0;
		let foundDist=this.points[0].distToSq(focal);
		const line=this.tmpLine();
		const c=this.tmpVec();
		let i:number;
		for([line.a,line.b,i] of this.points.pairs()){
			line.closestPointToPoint(focal,c);
			const dist=c.distToSq(focal);
			if(foundDist>dist){
				foundDist=dist;
				found=i+line.indexOf(c);
			}
		}
		return found;
	}

	public merge(
		that:this,
		epsilon:number,
	){
		if(this.points.length===0 || that.points.length===0){
			this.points=this.points.concat(that.points);
			return this;
		}
		const dists=[
			this.at(-1)!.distToSq(that.at(+0)!),
			this.at(-1)!.distToSq(that.at(-1)!),
			this.at(+0)!.distToSq(that.at(-1)!),
			this.at(+0)!.distToSq(that.at(+0)!),
		];
		let i=dists.lowestIndex();

		let pointsA:Point[];
		let pointsB:Point[];
		if(i<2){
			pointsA=this.points;
			pointsB=i===0?that.points:that.points.slice().reverse();
		}else{
			pointsA=i===2?that.points.slice():that.points.slice().reverse();
			pointsB=this.points;
		}
		if(dists[i]<epsilon**2)
			pointsA.pop();
		this.points=pointsA.concat(pointsB);
		return this;
	}

	public fragment(wantedInterval:number){
		if(this.count<2 || wantedInterval<=0)
			return this;
		let a=this.points.at(0)!;
		const points:Point[]=[a];
		for(let i=1;i<this.points.length;++i){
			const b=this.points[i];
			const distance=a.distTo(b);
			const count=Math.ceil(distance/wantedInterval);
			for(let j=1;j<count;j++)
				points.push(a.clone().lerp(b,j/count));
			points.push(b);
			a=b;
		}
		this.points=points;
		return this;
	}

	public resample(wantedInterval:number){
		if(this.count<2){
			this.points=this.points.map(p=>p.clone());
			return this;
		}
		const length=this.len();
		const intervalCount=Math.ceil(this.len()/wantedInterval);
		const intervalLength=length/intervalCount;

		const points:Point[]=[this.points[0].clone()];
		let stepDist=intervalLength;
		let aDist=0;
		let a=this.points[0];
		for(let i=1;i<this.points.length;++i){
			const b=this.points[i];
			const segDist=a.distTo(b);
			const bDist=aDist+segDist;
			while(stepDist<bDist && points.length<intervalCount){
				points.push(a.clone().lerp(b,(stepDist-aDist)/segDist));
				stepDist+=intervalLength;
			}
			a=b;
			aDist=bDist;
		}
		points.push(this.at(-1)!.clone());
		this.points=points;
		return this;
	}

	public douglasPeuckerFilter(threshold:number){
		this.points=douglasPeuckerFilter(this.points,p=>p,threshold);
		return this;
	}

	public soften(iterations:number){
		const {points}=this;
		let tmp=points.map(p=>p.clone());
		for(let itIndex=0;itIndex<iterations;++itIndex){
			for(let i=1;i<tmp.length-1;++i)
				tmp[i].copy(points[i-1]).mean(points[i+1]);
			for(const [i,p] of points.entries())
				p.copy(tmp[i]);
		}
		return this;
	}

	//takes all the points and forces them into a line never moving farther away from the end point, point behind first point or past the last point are removed
	public forceLinear(){
		if(this.count<=2)
			return this;
		const a=this.first()!;
		const b=this.last()!;
		const dir=this.newVec().diff(b!,a).nrm();
		const min=dir.dot(a);
		const max=dir.dot(b);
	
		let innerIndices=[...this.points.keys()].slice(1,this.points.length-1);
		const map=new Map<number,number>();
		for(const i of innerIndices){
			map.set(i,dir.dot(this.points[i]));
		}
		innerIndices=innerIndices.filter(p=>{
			const dist=map.get(p)!;
			return min<dist && dist<max;
		});

		innerIndices.sort((i,j)=>map.get(i)!-map.get(j)!);
	
		const points=[a];
		let prevIndex=0;
		for(const i of innerIndices){
			if(i<=prevIndex){
				const q=points[points.length-1].clone().mean(this.points[i]);
				points[points.length-1]=q;
			}else{
				prevIndex=i;
				points.push(this.points[i]);
			}
		}
		points.push(b);
		this.points=points;
		return this;
	}

	//forces dist of the points from a straight line formed by the first and last to be no steep than distanceAlong*factor
	public smoothAmplitude(factor:number){
		if(this.count<=2)
			return this;
		const line=this.newLine(this.first()!,this.last()!);
		let a=this.points[0];
		let aDist=0;
		let along=0;
		for(let i=1;i+1<this.points.length;++i){
			const b=this.points[i];
			const step=Math.abs(line.distOf(b)-along);
			const bcp=line.closestPointToPoint(b,this.tmpVec());
			let bDist=b.distTo(bcp);
			const maxDist=step*factor+aDist;
			if(bDist>maxDist){
				b.lerp(bcp,1-maxDist/bDist);
				bDist=maxDist;
			}
			a=b;
			aDist=bDist;
			along+=step;
		}
		line.reverse();
		a=this.points[this.points.length-1];
		aDist=0;
		along=0;
		for(let i=this.points.length-2;i>=0;--i){
			const b=this.points[i];
			const step=Math.abs(line.distOf(b)-along);
			const bcp=line.closestPointToPoint(b,this.tmpVec());
			let bDist=b.distTo(bcp);
			const maxDist=step*factor+aDist;
			if(bDist>maxDist){
				b.lerp(bcp,1-maxDist/bDist);
				bDist=maxDist;
			}
			a=b;
			aDist=bDist;
			along+=step;
		}
		return this;
	}
}

export namespace LineString{

	export interface AssemblableLine<Point extends _Vec>{
		at(i:number):Point;
		[Symbol.iterator]():Iterator<Point>;
	}

	class EplisonSortedPointList<Point extends _Vec>{
		public constructor(
			lines:Iterable<AssemblableLine<Point>>,
			public readonly epsilon:number,
			private readonly getSortValue:(p:Point)=>number,
		){
			const {map}=this;
			for(const line of lines){
				for(const i of <(0|-1)[]>[0,-1])
					map.add(Math.floor(getSortValue(line.at(i))/epsilon),[line,i]);
			}
		}
	
		private readonly map=new MultiMap<number,[AssemblableLine<Point>,0|-1]>();
	
		public getNear(p:Point){
			const key=Math.floor(this.getSortValue(p)/this.epsilon);
			const a=(this.map.get(key) ?? []);
			const b=(this.map.get(key-1) ?? []);
			const c=(this.map.get(key+1) ?? []);
			return a.concat(b).concat(c);
		}
	}


	export function _assembleFromLines<Point extends _Vec>(
		_lines:AssemblableLine<Point>[],
		epsilon:number,
		getSortValue:(p:Point)=>number,
	){
		const lines=new Set(_lines);
		if(lines.size===0)
			return [];

		const map=new EplisonSortedPointList(lines,epsilon,getSortValue);

		const epsilonSq=epsilon**2;
		const lineStrings:Point[][]=[];
		for(let _ls of lines){
			lines.delete(_ls);
			const ls=[..._ls];

			while(true){
				let foundDist=Infinity;
				let found:[AssemblableLine<Point>,number,0|-1];
				for(let lsi=-1;lsi<=0;++lsi){
					const nearLines=map.getNear(ls.at(lsi)!);
					for(const [line,li] of nearLines){
						if(lines.has(line)){
							const dist=ls.at(lsi)!.distToSq(line.at(li));
							if(foundDist>dist){
								foundDist=dist;
								found=[line,lsi,li];
							}
						}
					}
				}
				if(foundDist>=epsilonSq)
					break;
				let [line,lsi,li]=found!;
				lines.delete(line);
				
				//const p=(li==='a'?line['b']:line['a']);
				const points=[...line];
				if(lsi<0){
					if(li<0)
						points.reverse();
					ls.pop();
					ls.push(...points);
				}else{
					if(li>=0)
						points.reverse();
					points.pop();
					ls.unshift(...points);
				}
			}
			lineStrings.push(ls);
		}
		return lineStrings;
	}
}