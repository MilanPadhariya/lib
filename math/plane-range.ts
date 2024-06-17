import { Vec } from "./vec";
import { Vec3 } from "./vec3";

export class PlaneRange{
	public constructor(
		public nrm:Vec=new Vec3(1,0,0),
		public min=+Infinity,
		public max=-Infinity,
	){
	}

	public containsPoint(p:Vec){
		return this.containsDot(this.nrm.dot(p));
	}

	public containsDot(d:number){
		return this.min<=d && d<=this.max;
	}
}