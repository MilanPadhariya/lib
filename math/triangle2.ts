import { Limit } from './limit';
import { Line2 } from './line2';
import { Vec2,Vec2Like } from './vec2';

const tmpV2A=new Vec2();
const tmpV2B=new Vec2();
const tmpV2C=new Vec2();
const tmpLine=new Line2();
const tmpLimit=new Limit();

export class Triangle2<Corner extends Vec2=Vec2>{
	public constructor(
		a:Corner=<Corner>new Vec2(),
		b:Corner=<Corner>new Vec2(),
		c:Corner=<Corner>new Vec2(),
	){
		this.a=a;
		this.b=b;
		this.c=c;
	}

	public a:Corner;
	public b:Corner;
	public c:Corner;

	public clone():this{
		return new (<any>this.constructor)(this.a.clone(),this.b.clone(),this.c.clone());
	}

	public at(i:number){
		i%=3;
		if(i<0)
			i+=3;
		switch(i){
			case 0:
				return this.a;
			case 1:
				return this.b;
			case 2:
				return this.c;
			default:
				return undefined;
		}
	}

	*[Symbol.iterator](){
		yield this.a;
		yield this.b;
		yield this.c;
	}

	public circumcenter():Vec2;
	public circumcenter<Point extends Vec2>(out:Point):Point;
	public circumcenter(out=new Vec2()){
		const dx=this.b.x-this.a.x;
		const dy=this.b.y-this.a.y;
		const ex=this.c.x-this.a.x;
		const ey=this.c.y-this.a.y;

		const bl=dx*dx+dy*dy;
		const cl=ex*ex+ey*ey;
		const d=0.5 /(dx*ey-dy*ex);

		const x=this.a.x+(ey*bl-dy*cl)*d;
		const y=this.a.y+(dx*cl-ex*bl)*d;

		return out.set(x,y);
	}

	public weightedCenter():Vec2;
	public weightedCenter<Point extends Vec2>(out:Point):Point;
	public weightedCenter(out=new Vec2()){
		const lengths=this.sideLengths();

		out.copy(this.a).mean(this.b).multiplyScalar(lengths[0]);
		out.add(tmpV2A.copy(this.b).mean(this.c).multiplyScalar(lengths[1]));
		out.add(tmpV2A.copy(this.c).mean(this.a).multiplyScalar(lengths[2]));
		out.divideScalar(lengths[0]+lengths[1]+lengths[2]);
		return out;
	}

	public area(){
		return Triangle2.area(this.a,this.b,this.c);
	}

	public areaSigned(){
		return Triangle2.areaSigned(this.a,this.b,this.c);
	}

	public isObtuse(onSide?:number){
		return Triangle2.isObtuse(this.a,this.b,this.c,onSide);
	}

	public obtuseFactor(onSide?:number){
		return Triangle2.obtuseFactor(this.a,this.b,this.c,onSide);
	}

	public *sides(){
		const out:Line2<Corner>=new Line2<Corner>(<any>null,<any>null);
		out.a=this.a;
		out.b=this.b;
		yield <[Line2<Corner>,number]>[out,0];
		out.a=this.b;
		out.b=this.c;
		yield <[Line2<Corner>,number]>[out,1];
		out.a=this.c;
		out.b=this.a;
		yield <[Line2<Corner>,number]>[out,2];
	}

	public sideAt(i:number, out=new Line2<Corner>){
		i%=3;
		if(i<0)
			i+=3;
		switch(i){
			case 0:
				out.a=this.a;
				out.b=this.b;
				break;
			case 1:
				out.a=this.b;
				out.b=this.c;
				break;
			case 2:
				out.a=this.c;
				out.b=this.a;
				break;
			default:
				return undefined;
		}
		return out;
	}

	public sideLengths(){
		return [this.a.distanceTo(this.b),this.b.distanceTo(this.c),this.c.distanceTo(this.a)];
	}

	public sideLengthsSqr(){
		return [this.a.distanceToSquared(this.b),this.b.distanceToSquared(this.c),this.c.distanceToSquared(this.a)];
	}

	public contains(p:Vec2Like, marginOfError=0.01){
		return Triangle2.contains(this.a,this.b,this.c,p,marginOfError);
	}

	public centroid():Vec2;
	public centroid<P extends Vec2>(out:P):P;
	public centroid<P extends Vec2>(out?:P){
		if(out)
			return out.set((this.a.x+this.b.x+this.c.x)/3,(this.a.y+this.b.y+this.c.y)/3);
		return new Vec2((this.a.x+this.b.x+this.c.x)/3,(this.a.y+this.b.y+this.c.y)/3);
	}

	public closestPointToPoint(p:Vec2, out=new Vec2()){
		tmpLine.a=this.a;
		tmpLine.b=this.b;
		tmpLine.closestPoint(p,tmpV2A);
		tmpLine.a=this.b;
		tmpLine.b=this.c;
		tmpLine.closestPoint(p,tmpV2B);
		tmpLine.a=this.c;
		tmpLine.b=this.a;
		tmpLine.closestPoint(p,tmpV2C);
		out.copy([tmpV2A,tmpV2B,tmpV2C].lowest(q=>p.distanceTo(q)));
		return out;
	}

	public distanceFromEdge(p:Vec2Like){
		return Triangle2.distanceFromEdge(this.a,this.b,this.c,p);
	}
}

export namespace Triangle2{
	export function areaSigned(a:Vec2Like, b:Vec2Like, c:Vec2Like){
		return (a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y))/2;
	}
	
	export function area(a:Vec2Like, b:Vec2Like, c:Vec2Like){
		return Math.abs(areaSigned(a,b,c));
	}

	export function isObtuse(a:Vec2Like, b:Vec2Like, c:Vec2Like, onSide?:number){
		const sideLengths=[
			(a.x-b.x)**2+(a.y-b.y)**2,
			(b.x-c.x)**2+(b.y-c.y)**2,
			(c.x-a.x)**2+(c.y-a.y)**2,
		]

		if(typeof(onSide)==='number'){
			return sideLengths[onSide]>sideLengths[(onSide+1)%3]+sideLengths[(onSide+2)%3];
		}

		sideLengths.sort((a,b)=>a-b);
		return sideLengths[2]>sideLengths[0]+sideLengths[1];
	}

	export function obtuseFactor(a:Vec2Like, b:Vec2Like, c:Vec2Like, onSide?:number){
		const sideLengths=[
			(a.x-b.x)**2+(a.y-b.y)**2,
			(b.x-c.x)**2+(b.y-c.y)**2,
			(c.x-a.x)**2+(c.y-a.y)**2,
		]

		if(typeof(onSide)==='number'){
			return Math.sqrt(sideLengths[onSide])/Math.sqrt(sideLengths[(onSide+1)%3]+sideLengths[(onSide+2)%3]);
		}

		sideLengths.sort((a,b)=>a-b);
		return Math.sqrt(sideLengths[2])/Math.sqrt(sideLengths[0]+sideLengths[1]);
	}

	export function containment(a:Vec2Like, b:Vec2Like, c:Vec2Like, p:Vec2Like){
		const A=area(a,b,c);
		const A1=area(p,b,c);
		const A2=area(a,p,c);
		const A3=area(a,b,p);
		return Math.abs(A-(A1+A2+A3));
	}

	export function contains(a:Vec2Like, b:Vec2Like, c:Vec2Like, p:Vec2Like, marginOfError=0.01){
		let A=area(a,b,c);
		const A1=area(p,b,c);
		const A2=area(a,p,c);
		const A3=area(a,b,p);
		A=A/(A1+A2+A3);
		return Math.abs(A-1)<marginOfError;
	}

	export function distanceFromEdge(a:Vec2Like, b:Vec2Like, c:Vec2Like,p:Vec2Like){
		let out=tmpLimit.fromPoints(a,b).distanceToPoint(p);
		out=Math.max(out,tmpLimit.fromPoints(b,c).distanceToPoint(p));
		out=Math.max(out,tmpLimit.fromPoints(c,a).distanceToPoint(p));
		return out;
	}

}
