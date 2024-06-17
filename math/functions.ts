
export function clamp(x:number, min:number, max:number){
	if(min>max)
		throw 'bad clamp';
	if(x<min)
		return min;
	if(x>max)
		return max;
	return x;
}

export function lerp(a:number, b:number, f:number){
	return a+(b-a)*f;
}

export function roundTo(n:number, place:number){
	return Math.round(n/place)*place;
}

export function roundToLog10(n:number, adjustment=0){
	return 10**Math.round(Math.log10(n)+adjustment);
}

export function saturate(n:number){
	return n<0?0:n<1?n:1;
}

export function withinThresholdPercent(a:number, b:number, thresholdPercent:number){
	return Math.abs(1-a/b)<=thresholdPercent;
}

export function randomInt(min:number, max:number){
	const length=max-min;
	return Math.floor(Math.random()*length)+min;
}
