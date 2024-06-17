import { Vec,VecLike } from "./vec";

export interface Box<Point extends Vec>{
	min:Point;
	max:Point;

	fromArray(a:number[]):this;
	toArray():number[];

	clone():this;

	size():Point;
	maxSide():'x'|'y'|'z';
	maxSize():number;
	center():Point;
	center<T extends Point>(out:T):T;
	corners():Iterator<Point,void>;
	
	setEmpty():this;
	expandByPoint(p:Vec):this;
	expandByPoints(points:Iterable<Vec>):this;
	union(that:Box<Point>):this;

	distToPointSq(point:VecLike):number;
	distToPoint(point:VecLike):number;
	containsPoint(point:VecLike):boolean; //inclusive
	intersectsBox(that:Box<Point>):boolean;
}
