import { Vec3 } from "./vec3";

export class Cylinder{
	public constructor(
		public a=new Vec3(),
		public b=new Vec3(),
		public radius=0,
	){
	}

	public center(){
		return this.b.clone().mean(this.a);
	}

	public length(){
		return this.b.distTo(this.a);
	}

	public direction(){
		return this.b.clone().sub(this.a).normalize();
	}
}
