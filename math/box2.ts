import * as three from 'three';
import { Box } from './box';
import { lerp } from './functions';
import { Vec2,Vec2Like } from './vec2';

const tmpV2A=new Vec2();

export class Box2 extends three.Box2 implements Box<Vec2>{
	public constructor(
		min=new Vec2(+Infinity,+Infinity),
		max=new Vec2(-Infinity,-Infinity)
	){
		super(min,max);
	}

	public fromArray(array:number[]){
		this.min.x=array[0] ?? this.min.x;
		this.min.y=array[1] ?? this.min.y;
		this.max.x=array[2] ?? this.min.x;
		this.max.y=array[3] ?? this.min.y;
		return this;
	}

	public toArray(){
		const out=<[number,number,number,number]>[0,0,0,0];
		this.min.toArray(out,0);
		this.max.toArray(out,2);
		return out;
	}

	public size(dim:'x'|'y'):number;
	public size():Vec2;
	public size<T extends Vec2>(out:T):T;
	public size(arg:Vec2|'x'|'y'=new Vec2()){
		if(typeof(arg)==='string')
			return this.max[arg]-this.min[arg];
		arg.x=this.max.x-this.min.x;
		arg.y=this.max.y-this.min.y;
		return arg;
	}

	public maxSize(){
		const x=this.max.x-this.min.x;
		const y=this.max.y-this.min.y;
		if(y>x)
			return y;
		return x;
	}

	public maxSide(){
		const x=this.max.x-this.min.x;
		const y=this.max.y-this.min.y;
		if(y>x)
			return 'y';
		return 'x';
	}

	public center(dim:'x'|'y'):number;
	public center():Vec2;
	public center<T extends Vec2>(out:T):T;
	public center(arg:Vec2|'x'|'y'=new Vec2()){
		if(typeof(arg)==='string')
			return (this.max[arg]+this.min[arg])/2;
		arg.x=(this.max.x+this.min.x)/2;
		arg.y=(this.max.y+this.min.y)/2;
		return arg;
	}

	public atCorner(i:number){
		i%=4;
		if(i<0)
			i+=4;
		return new Vec2(this[i%3===0?'min':'max'].x,this[i<2?'min':'max'].y);
	}

	public *corners(){
		yield this.min.clone();
		yield new Vec2(this.max.x,this.min.y);
		yield this.max.clone();
		yield new Vec2(this.min.x,this.max.y);
	}

	public area(){
		return (this.max.x-this.min.x)*(this.max.y-this.min.y);
	}

	public setEmpty(){
		this.makeEmpty();
		return this;
	}

	public expandByPoints(points:Iterable<Vec2Like>):this{
		for(const p of points)
			this.expandByPoint(p);
		return this;
	}

	public contains(that:Vec2Like|number[]){
		if(Array.isArray(that))
			return this.min.x<=that[0] && that[0]<=this.max.x && this.min.y<=that[1] && that[1]<=this.max.y;
		return this.min.x<=that.x && that.x<=this.max.x && this.min.y<=that.y && that.y<=this.max.y;
	}

	public distToPointSq(p:Vec2Like){
		tmpV2A.copy(p).clamp(this.min,this.max);
		return tmpV2A.sub(p).lengthSq();
	}

	public distToPoint(p:Vec2Like){
		return Math.sqrt(this.distToPointSq(p))
	}

	private clipLinePoint(p:Vec2, a:Vec2, b:Vec2){
		if(p.x<this.min.x){
			p=p.clone();
			p.y=lerp(a.y,b.y,(this.min.x-a.x)/(b.x-a.x));
			p.x=this.min.x;
		}else if(p.x>this.max.x){
			p=p.clone();
			p.y=lerp(a.y,b.y,(this.max.x-a.x)/(b.x-a.x));
			p.x=this.max.x;
		}
		if(p.y<this.min.y){
			p=p.clone();
			p.x=lerp(a.x,b.x,(this.min.y-a.y)/(b.y-a.y));
			p.y=this.min.y;
		}else if(p.y>this.max.y){
			p=p.clone();
			p.x=lerp(a.x,b.x,(this.max.y-a.y)/(b.y-a.y));
			p.y=this.max.y;
		}
		return p;
	}

	public clipLine(a:Vec2, b:Vec2){
		if(a.x<this.min.x && b.x<this.min.x)
			return [];
		if(a.y<this.min.y && b.y<this.min.y)
			return [];
		if(a.x>this.max.x && b.x>this.max.x)
			return [];
		if(a.y>this.max.y && b.y>this.max.y)
			return [];

		a=this.clipLinePoint(a,a,b);
		b=this.clipLinePoint(b,a,b);
		return [a,b];
	}

	public clipLineString(points:Vec2[], wrap:boolean){
		points=points.slice();
		const start=wrap?0:1;
		let inside=points.map(p=>p.x>this.min.x);
		for(let i=start;i<points.length;++i){
			const j=i>0?i-1:points.length-1;
			if(inside[j]!==inside[i]){
				const a=points[j];
				const b=points[i];
				const p=a.clone();
				p.x=this.min.x;
				p.y=lerp(a.y,b.y,(p.x-a.x)/(b.x-a.x));
				points.splice(i,0,p);
				inside.splice(i,0,true);
				i+=1;
			}
		}
		points=points.filter((_,i)=>inside[i]);

		inside=points.map(p=>p.x<this.max.x);
		for(let i=start;i<points.length;++i){
			const j=i>0?i-1:points.length-1;
			if(inside[j]!==inside[i]){
				const a=points[j];
				const b=points[i];
				const p=a.clone();
				p.x=this.max.x;
				p.y=lerp(a.y,b.y,(p.x-a.x)/(b.x-a.x));
				points.splice(i,0,p);
				inside.splice(i,0,true);
				i+=1;
			}
		}
		points=points.filter((_,i)=>inside[i]);

		inside=points.map(p=>p.y>this.min.y);
		for(let i=start;i<points.length;++i){
			const j=i>0?i-1:points.length-1;
			if(inside[j]!==inside[i]){
				const a=points[j];
				const b=points[i];
				const p=a.clone();
				p.y=this.min.y;
				p.x=lerp(a.x,b.x,(p.y-a.y)/(b.y-a.y));
				points.splice(i,0,p);
				inside.splice(i,0,true);
				i+=1;
			}
		}
		points=points.filter((_,i)=>inside[i]);

		inside=points.map(p=>p.y<this.max.y);
		for(let i=start;i<points.length;++i){
			const j=i>0?i-1:points.length-1;
			if(inside[j]!==inside[i]){
				const a=points[j];
				const b=points[i];
				const p=a.clone();
				p.y=this.max.y;
				p.x=lerp(a.x,b.x,(p.y-a.y)/(b.y-a.y));
				points.splice(i,0,p);
				inside.splice(i,0,true);
				i+=1;
			}
		}
		points=points.filter((_,i)=>inside[i]);
		return points;
	}

	public adjusterTo(that:Box2){
		const inMinX=this.min.x;
		const inMinY=this.min.y;
		const inSizeX=this.size('x');
		const inSizeY=this.size('y');
		const outMinX=that.min.x;
		const outMinY=that.min.y;
		const outSizeX=that.size('x');
		const outSizeY=that.size('y');
		const scaleX=outSizeX/inSizeX;
		const scaleY=outSizeY/inSizeY;
		const adjuster=<Box2.Adjuster>((p:Vec2Like, out=new Vec2())=>{
			return out.set((p.x-inMinX)*scaleX+outMinX,(p.y-inMinY)*scaleY+outMinY);
		});
		//const adjuster=<Box2Adjuster>((v:number)=>(v-this.min)*scale+that.max);
		adjuster.x=x=>(x-inMinX)*scaleX+outMinX;
		adjuster.y=y=>(y-inMinY)*scaleY+outMinY;
		adjuster.inputRange=this;
		adjuster.outputRange=that;
		return adjuster;
	}
}

export interface Box2 extends three.Box2{
	min:Vec2;
	max:Vec2;

	clampPoint<T extends three.Vector2>(point:Vec2Like,target:T):T;
	containsPoint(point:Vec2Like):boolean;
	expandByPoint(point:Vec2Like):this;
	expandByScalar(scalar:number):this;
	intersectsBox(that:{min:Vec2Like,max:Vec2Like}):boolean;
	makeEmpty():this;
	intersect(box:three.Box2):this;
	setFromPoints(points:Vec2Like[]):this;
	translate(offset:Vec2Like):this;
	union(that:{min:Vec2Like,max:Vec2Like}):this;
}

export namespace Box2{
	export function from(minx:number, miny:number, maxx:number, maxy:number){
		return new Box2(new Vec2(minx,miny), new Vec2(maxx,maxy));
	}

	export function fromArray(array:number[]){
		return new Box2().fromArray(array);
	}

	export function fromPoints(points:Iterable<Vec2>){
		return new Box2().expandByPoints(points);
	}

	export function fromDOMRect(rect:DOMRect){
		return new Box2(new Vec2(rect.x,rect.y),new Vec2(rect.right,rect.bottom));
	}

	export interface Adjuster{
		inputRange:Box2;
		outputRange:Box2;
		x(x:number):number;
		y(y:number):number;
		(v:Vec2Like,out:Vec2):Vec2;
	}
}
