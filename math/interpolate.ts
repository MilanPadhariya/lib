export function interpolate(
	point1:{x:number,y:number},
	point2:{x:number,y:number},
	x:number
) {
	//y=mx+b
	let slope=(point2.y-point1.y)/(point2.x-point1.x);
	let offset=point1.y-slope*point1.x;

	return slope*x+offset;
}

export function interpolaterGenerator(
	evidence: {x:number,y:number}[],
	uppperOutOfBoundValue?: number,
	lowerOutOfBoundValue?: number
){
	return (value:number)=>{
		let i=0;
		while(i < evidence.length && value > evidence[i].x) {
			i++;
		}
		if(i===evidence.length) {
			if(uppperOutOfBoundValue!==undefined) return uppperOutOfBoundValue;
			return evidence[evidence.length-1].y;
		}
		else if(i===0){
			if(lowerOutOfBoundValue!==undefined) return lowerOutOfBoundValue;
			return evidence[0].y;
		}
		else {
			return interpolate(evidence[i],evidence[i-1],value);
		}
	};
}
