import { Vec } from "./vec";

export interface Triangle<Point extends Vec>{
	a:Point;
	b:Point;
	c:Point;

	area():number;
	centroid():Vec;
}
