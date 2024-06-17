import { Triangle2 } from "./triangle2";

export function convexHull<Point extends {x:number, y:number}>(points:Point[]){
	points.sort(function (a, b){
		return a.x!=b.x?a.x-b.x:a.y-b.y;
	});

	let n=points.length;
	let hull:Point[]=[];

	for (let i=0;i<2*n;i++) {
		let j=i<n?i:2*n-1-i;
		while (hull.length>=2 && removeMiddle(hull[hull.length-2], hull[hull.length-1], points[j]))
			hull.pop();
		hull.push(points[j]);
	}

	hull.pop();
	return hull;
}

function removeMiddle(a:{x:number, y:number}, b:{x:number, y:number}, c:{x:number, y:number}){
	let cross=(a.x-b.x)*(c.y-b.y)-(a.y-b.y)*(c.x-b.x);
	let dot=(a.x-b.x)*(c.x-b.x)+(a.y-b.y)*(c.y-b.y);
	return cross<0 || cross==0 && dot<=0;
}

export function convexPolygonArea(points:{x:number,y:number}[]){
	const fp=points[0];
	let total=0;
	for(let i=1;i<points.length;++i)
		total+=Triangle2.area(fp,points[i],points[(i+1)%points.length]);
	return total;
}
