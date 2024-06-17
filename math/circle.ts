import { farthestPair } from './farthest';
import { lerp } from './functions';
import { Vec2,Vec2Like } from './vec2';

export class Circle{
	public constructor(
		public readonly center=new Vec2(),
		public radius=0,
	){
	}

	public clone(){
		return new Circle(this.center.clone(),this.radius);
	}

	public setFromPoints(p1:Vec2, p2:Vec2, p3:Vec2){
		const x12=(p1.x-p2.x);
		const x13=(p1.x-p3.x);

		const y12 =( p1.y-p2.y);
		const y13=(p1.y-p3.y);

		const y31=(p3.y-p1.y);
		const y21=(p2.y-p1.y);

		const x31=(p3.x-p1.x);
		const x21=(p2.x-p1.x);

		//p1.x^2-p3.x^2
		const sx13=Math.pow(p1.x, 2)-Math.pow(p3.x, 2);

		// p1.y^2-p3.y^2
		const sy13=Math.pow(p1.y, 2)-Math.pow(p3.y, 2);

		const sx21=Math.pow(p2.x, 2)-Math.pow(p1.x, 2);
		const sy21=Math.pow(p2.y, 2)-Math.pow(p1.y, 2);

		const f=(
				(sx13)*(x12)
				+(sy13)*(x12)
				+(sx21)*(x13)
				+(sy21)*(x13)
			)
			/(2*((y31)*(x12)-(y21)*(x13)));
		const g=(
				(sx13)*(y12)
				+(sy13)*(y12)
				+(sx21)*(y13)
				+(sy21)*(y13)
			)
			/(2*((x31)*(y12)-(x21)*(y13)));

				const c=-(Math.pow(p1.x, 2)) -
		Math.pow(p1.y,2)-2*g*p1.x-2*f*p1.y;

		// eqn of circle be
		// x^2 + y^2 + 2*g*x + 2*f*y + c=0
		// where centre is (h=-g, k=-f) and radius r
		// as r^2=h^2 + k^2-c
		this.center.x=-g;
		this.center.y=-f;
		const sqr_of_r=this.center.x*this.center.x+this.center.y*this.center.y-c;

		// r is the radius
		this.radius=Math.sqrt(sqr_of_r);
		return this;
	}

	public x(y:number, sign:1|-1){
		return Math.sqrt(this.radius*this.radius-(y-this.center.y)**2)*sign+this.center.x;
	}

	public y(x:number, sign:1|-1){
		return Math.sqrt(this.radius*this.radius-(x-this.center.x)**2)*sign+this.center.y;
	}

	public contains(p:Vec2Like){
		return this.containsPoint(p);
	}

	public containsPoint(p:Vec2Like){
		return (p.x-this.center.x)**2+(p.y-this.center.y)**2<=this.radius*this.radius;
	}

	public circumference(){
		return this.radius*2*Math.PI;
	}

	public getPointsAlongCircumference(count:number, startAngle=0, endAngle=Math.PI*2){
		const out:Vec2[]=[];
		for(let i=0;i<count;++i){
			const v=Vec2.fromAzimuth(lerp(startAngle,endAngle,i/count));
			out.push(v.multiplyScalar(this.radius).add(this.center));
		}
		return out;
	}
}

export namespace Circle{
	export function contains(c:Vec2Like, r:number, p:Vec2Like){
		return (p.x-c.x)**2+(p.y-c.y)**2<=r*r;
	}

	export function fromPoints(points:Iterable<Vec2>){
		const farthest=farthestPair(points);
		if(!farthest)
			return null;
		return new Circle(farthest[0].clone().mean(farthest[1]),farthest[2]/2);
	}
}

