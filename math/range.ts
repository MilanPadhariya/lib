export class Range{
	constructor(
		public min=Infinity,
		public max=-Infinity,
	){
	}

	public toArray():[number,number]{
		return [this.min,this.max];
	}

	public fromArray(numbers:number[]){
		this.min=numbers[0];
		this.max=numbers[1];
	}

	public copy(that:Range){
		this.min=that.min;
		this.max=that.max;
		return this;
	}

	public clone():this{
		return new (<any>this.constructor)().copy(this);
	}

	public center(){
		return (this.min+this.max)/2;
	}

	public set(min:number, max:number){
		this.min=min;
		this.max=max;
	}

	public makeEmpty(){
		this.min=Infinity;
		this.max=-Infinity;
		return this;
	}

	public equals(that:Range){
		return this.min==that.min && this.max && that.max;
	}

	public expandByPoint(v:number){
		if(this.min>v)
			this.min=v;
		if(this.max<v)
			this.max=v;
		return this;
	}

	public expandByPoints(list:Iterable<number>){
		for(const v of list)
			this.expandByPoint(v);
		return this;
	}

	public expandByScaler(v:number){
		this.min-=v;
		this.max+=v;
		return this;
	}

	public translate(delta:number){
		this.min+=delta;
		this.max+=delta;
		return this;
	}

	public scale(factor:number){
		this.min*=factor;
		this.max*=factor;
		return this;
	}

	public union(that:Range){
		this.min=Math.min(this.min,that.min);
		this.max=Math.min(this.max,that.max);
	}

	public contains(v:number){
		return this.min<=v && v<this.max;
	}

	public containsInclusive(v:number){
		return this.min<=v && v<=this.max;
	}

	public distToPoint(v:number){
		if(this.min<=v && v<=this.max)
			return 0;
		if(v<this.min)
			return v-this.min;
		return v-this.max;
	}

	public clamp(v:number){
		if(v<this.min)
			v=this.min;
		if(v>this.max)
			v=this.max;
		return v;
	}

	public intersects(that:Range){
		if(this.max<that.min)
			return false;
		if(this.min>that.max)
			return false;
		return true;
	}

	public empty(){
		return this.min>=this.max;
	}

	public size(){
		return this.max-this.min;
	}

	public getParameter(p:number){
		if(this.min===this.max)
			return 0;
		return (p-this.min)/(this.max-this.min);
	}

	public fromParameter(p:number){
		return this.min*(1-p)+this.max*p;
	}

	public intersection(that:{min:number,max:number}){
		this.min=Math.max(this.min,that.min);
		this.max=Math.min(this.max,that.max);
		return this;
	}

	public _intersection(that:{min:number,max:number}){
		this.min=Math.max(this.min,that.min);
		this.max=Math.min(this.max,that.max);
		return this;
	}

	public adjusterTo(that:Range):RangeAdjuster{
		const inSize=this.size();
		const outSize=that.size();
		const scale=outSize/inSize;
		const adjuster=<RangeAdjuster>((v:number)=>(v-this.min)*scale+that.max);
		adjuster.inputRange=this;
		adjuster.outputRange=that;
		return adjuster;
	}
}

interface RangeAdjuster{
	inputRange:Range;
	outputRange:Range;
	(v:number):number;
}

export namespace Range{
	export function fromArray(numbers:number[]){
		return new Range(numbers[0],numbers[1]);
	}

	export function fromPoints(numbers:Iterable<number>){
		const r=new Range();
		return r.expandByPoints(numbers);
	}

	export function infinite(){
		return new Range(-Infinity,+Infinity);
	}
}
