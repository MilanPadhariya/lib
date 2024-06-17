import { jStat } from 'jstat';
import { Vec2 } from './vec2';
import { Vec3 } from './vec3';
import { Range } from './range';

type CounterType={occurrence:number,value:number};

export function sum(data:Iterable<Vec2>):Vec2;
export function sum(data:Iterable<Vec3>):Vec3;
export function sum(data:Iterable<number>):number;
export function sum(data:Iterable<number|Vec2|Vec3>){
	const it=data[Symbol.iterator]();
	let result=it.next();
	if(result.done)
		return undefined;

	if(result.value instanceof Vec2){
		const sum=result.value.clone();
		result=it.next();
		while(!result.done){
			sum.add(<Vec2>result.value);
			result=it.next();
		}
		return sum;
	}
	if(result.value instanceof Vec3){
		const sum=result.value.clone();
		result=it.next();
		while(!result.done){
			sum.add(<Vec3>result.value);
			result=it.next();
		}
		return sum;
	}
	
	let sum=<number>result.value;
	result=it.next();
	while(!result.done){
		sum+=<number>result.value;
		result=it.next();
	}
	return sum;
}

// Arithmetic mean
export function mean(data:number[]):number;
export function mean(data:Vec2[], out?:Vec2):Vec2;
export function mean(data:Vec3[], out?:Vec3):Vec3;
export function mean(data:Iterable<any>, out?:Vec2|Vec3){
	const it=data[Symbol.iterator]();
	let result=it.next();
	if(result.done)
		return undefined;

	let count=0;
	if(result.value instanceof Vec2 || result.value instanceof Vec3){
		const Type=<{new ():Vec2|Vec3}>result.value.constructor;
		const sum=out?.setAll(0) || new Type();

		do{
			sum.add(result.value);
			count+=1;
			result=it.next();
		}while(!result.done);
		return sum.divideScalar(count);
	}

	let sum=0;
	do{
		sum+=result.value;
		count+=1;
		result=it.next();
	}while(!result.done);
	return sum/count;
}

// Standard deviation
export function standardDeviation(numbers:number[]) {
	const meanValue=mean(numbers);
	const variance=numbers.reduce((sum,n)=>sum+(n-meanValue)**2,0)/numbers.length;
	return Math.sqrt(variance);
};


export function mode(numbers: number[]):number {
	if (numbers.length === 0) {
		return 0;
	}

	const count:CounterType[] = numbers.reduce((items:CounterType[], current) => {
		const item = (items.length === 0) ? null : items.find((x) => x.value === current);
		(item) ? item.occurrence++ : items.push({ value: current, occurrence: 1 });
		return items;
	}, []);

	count.sort((a, b) => a.occurrence-b.occurrence || a.value-b.value);
	return count[0].value;
}

function medianOfSorted(sorted:number[]){
	if(sorted.length===0)
		return null;
	if(sorted.length%2===0){
		const midIndex=sorted.length/2;
		return (sorted[midIndex-1]+sorted[midIndex])/2;
	}
	return sorted[Math.floor(sorted.length/2)];
}

export function median(numbers:number[]){
	if(numbers.length===0)
		return null;
	const sorted=numbers.slice().sort((a,b)=>a-b);
	return medianOfSorted(sorted);
}

export function quartiles(numbers:number[]){
	if(numbers.length===0)
		return null;
	numbers=numbers.slice().sort((a,b)=>a-b);

	function medianSplit(numbers:number[]):[number[], number[]]{
		if(numbers.length === 0) {
			return [[], []];
		}
		if(numbers.length%2===0) {
			const i=numbers.length/2;
			return [numbers.slice(0,i),numbers.slice(i)];
		}
		const i=Math.floor(numbers.length/2);
		return [numbers.slice(0,i),numbers.slice(i+1)];
	}
	
	const [lower,upper]=medianSplit(numbers);
	const lq=medianOfSorted(lower)!;
	const uq=medianOfSorted(upper)!;
	return new Range(lq,uq);
}

export function percentile(numbers:number[], p:number){
	if(numbers.length===0) return undefined;
	const sorted=numbers.slice().sort((a,b)=>a-b);
	const index=p*(sorted.length-1);
	const lower=Math.floor(index);
	const upper=Math.ceil(index);
	const weight=index-lower;
	return sorted[lower]*(1-weight)+sorted[upper]*weight;
}

export interface Stats{
	min:number;
	max:number;
	middle:number;
	sum:number;
	mean:number;
	median:number;
	meanDeviation:number;
	standardDeviation:number;
};

export function stats(_numbers:Iterable<number>):Stats|null{
	let min=Infinity;
	let max=-Infinity;
	let sum=0;

	const numbers=[..._numbers];
	if(numbers.length===0)
		return null;
	numbers.sort((a,b)=>a-b);

	for(const n of numbers){
		if(min>n)
			min=n;
		if(max<n)
			max=n;
		sum+=n;
	}

	const mean=sum/numbers.length;
	let median=0;
	const midIndex=numbers.length/2;
	if(numbers.length%2==1)
		median=numbers[Math.floor(midIndex)];
	else
		median=(numbers[midIndex-1]+numbers[midIndex])/2;

	const meanDeviation=numbers.reduce((sum,n)=>sum+Math.abs(n-mean),0)/numbers.length;
	const variance=numbers.reduce((sum,n)=>sum+(n-mean)**2,0)/numbers.length;
	const standardDeviation=Math.sqrt(variance);

	return {
		min,
		max,
		middle: (min+max)*0.5,
		sum,
		mean,
		median,
		meanDeviation,
		standardDeviation,
	};
}

export function differences(numbers:number[]){
	const differences:number[]=[];
	for(let i=1;i<numbers.length;++i)
		differences.push(numbers[i]-numbers[i-1]);
	return differences;
}

// export function factorSteps(numbers:number[]){
// 	const differences:number[]=[];
// 	for(let i=1;i<numbers.length;++i)
// 		differences.push(numbers[i]/numbers[i-1]);
// 	return differences;
// }

class Distribution{
	public readonly studentt=jStat.studentt;
}

export const distribution=new Distribution();
