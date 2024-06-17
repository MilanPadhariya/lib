import { Vec as _Vec } from "./vec";

export function farthestPair<Vec extends _Vec>(_points:Iterable<Vec>|(Vec[])){
	const points=Array.isArray(_points)?_points:[..._points];
	let farthestDist=0;
	let farthestPair:[Vec,Vec]|null=null;
	for(const [pi,p] of points.entries()){
		for(let qi=pi+1;qi<points.length;++qi){
			const q=points[qi];
			const dist=p.distToSq(q);
			if(farthestDist<dist){
				farthestDist=dist;
				farthestPair=[p,q];
			}
		}
	}
	if(!farthestPair)
		return null;
	return <const>[...farthestPair,Math.sqrt(farthestDist)];
}

export function farthestDistBetween<Vec extends _Vec>(_points:(Vec[])|Set<Vec>){
	const points=Array.isArray(_points)?_points:[..._points];
	let farthestDist=-1;
	for(const [pi,p] of points.entries()){
		for(let qi=pi+1;qi<points.length;++qi){
			const q=points[qi];
			const dist=p.distToSq(q);
			if(farthestDist<dist){
				farthestDist=dist;
			}
		}
	}
	if(farthestDist<0)
		return undefined;
	return farthestDist;
}

export function farthestDistBetweenLessThen<Vec extends _Vec>(_points:(Vec[])|Set<Vec>, thresholdDist:number){
	const thresholdDistSq=thresholdDist**2;
	const points=Array.isArray(_points)?_points:[..._points];
	for(const [pi,p] of points.entries()){
		for(let qi=pi+1;qi<points.length;++qi){
			const q=points[qi];
			const distSq=p.distToSq(q);
			if(distSq>=thresholdDistSq){
				return false;
			}
		}
	}
	return true;
}
