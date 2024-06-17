
function lerp(a:number, b:number, f:number){
	return a+(b-a)*f;
}

//its like a 1D LineString
export class NumberString{
	constructor(
		public points:number[],
	){
	}

	public clone(){
		return <this>new (Object.getPrototypeOf(this).constructor)(this.points.slice());
	}

	public get count(){
		return this.points.length;
	}

	public [Symbol.iterator](){
		return this.points.values();
	}

	public length(){
		let length=0;
		for(const [a,b] of this.points.pairs())
			length+=Math.abs(a-b);
		return length;
	}

	public at(i:number){
		return this.points.at(i);
	}

	public first(){
		return this.points.at(0);
	}

	public last(){
		return this.points.at(-1);
	}

	public unshift(p:number){
		return this.points.unshift(p);
	}

	public push(p:number){
		return this.points.push(p);
	}

	public atDist(length:number, clamp:boolean){
		if(clamp && length<=0)
			return this.points.at(0);
		for(const [a,b] of this.points.pairs()){
			const segLength=Math.abs(a-b);
			if(length<segLength){
				return lerp(a,b,length/segLength);
			}else{
				length-=segLength;
			}
		}
		if(clamp)
			return this.points.at(-1);
		const a=this.points.at(-2)!;
		const b=this.points.at(-1)!;
		const segLength=Math.abs(a-b);
		return lerp(a,b,length/segLength);
	}

	public atIndex(index:number, clamp:true):number;
	public atIndex(index:number, clamp:false):number|undefined;
	public atIndex(index:number, clamp:boolean){
		if(clamp){
			if(index<0)
				index=0;
			if(index>this.points.length-1)
				index=this.points.length-1;
		}

		let i=Math.floor(index);
		if(i<0)
			return undefined;
		if(i>this.points.length-1)
			return undefined;
		const p=this.points[i];
		if(i===index)
			return p;
		return lerp(p,this.points[i+1],index-i);
	}

	//grabs a section of the line string kinda like String.substring does for strings
	//except it allows fractional indexes (blending between points) and the endIndex is inclusive
	public substring(beginIndex:number, endIndex:number){
		let reverse=beginIndex>endIndex;
		if(reverse)
			[beginIndex,endIndex]=[endIndex,beginIndex];
		if(beginIndex<0)
			beginIndex=0;
		if(endIndex>this.points.length-1)
			endIndex=this.points.length-1;

		const points:number[]=[];
		if(beginIndex===endIndex){
			points.push(this.atIndex(beginIndex,true));
		}else{
			const beginInner=Math.ceil(beginIndex);
			const endInner=Math.floor(endIndex);
			if(beginIndex<beginInner)
				points.push(lerp(this.points[beginInner-1],this.points[beginInner],beginIndex%1));
			points.push(...this.points.slice(beginInner,endInner+1));
			if(endIndex>endInner)
				points.push(lerp(this.points[endInner],this.points[endInner+1],endIndex%1));
		}
		if(reverse)
			points.reverse();
		return <this>new (Object.getPrototypeOf(this).constructor)(points);
	}

	public transform(transformer:(p:number)=>number){
		for(let i=0;i<this.points.length;++i){
			this.points[i]=transformer(this.points[i]);
		}
		return this;
	}

	public translate(delta:number){
		for(let i=0;i<this.points.length;++i)
			this.points[i]+=delta;
		return this;
	}

	public pairs(){
		return this.points.pairs(false);
	}

	public triplets(){
		return this.points.triplets(false);
	}
}
