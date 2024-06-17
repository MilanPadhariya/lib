
export function uniqueFractionFromInteger(i:number){
	i=Math.floor(Math.abs(i));
	if(i===0 || i===1)
		return i;
	const log=Math.log2(i);
	const delta=(2**Math.ceil(log-1));
	const diviser=(2**Math.ceil(log));
	const numerator=((i-delta)*2-1);
	return numerator/diviser;
}
