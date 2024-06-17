import { Vec } from "./vec";

export function matchPointSets<T>(setA:T[], setB:T[], toPoint:(v:T)=>Vec){
	let possiblities:{a:T,b:T,dist:number}[]=[];

	for(const a of setA){
		const pa=toPoint(a);
		for(const b of setB){
			if(a!==b){
				const pb=toPoint(b);
				possiblities.push({a,b,dist:pa.distToXY(pb)});
			}
		}
	}
	possiblities.sort((a,b)=>b.dist-a.dist);

	const pairs=new Map<T,T>();
	while(possiblities.length>0){
		const pair=possiblities.pop()!;
		pairs.set(pair.a,pair.b);
		pairs.set(pair.b,pair.a);
		possiblities=possiblities.filter(v=>v.a!==pair.a && v.a!==pair.b && v.b!==pair.a && v.b!==pair.b);
	}
	return pairs;
}
