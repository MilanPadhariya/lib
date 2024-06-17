export class DateTime extends Date{
	public toString(){
		if(this.invalid())
			return 'Invalid time';
		return super.toISOString();
	}

	public clone(){
		return new DateTime(this);
	}

	public valid(){
		return !isNaN(this.getTime());
	}

	public invalid(){
		return isNaN(this.getTime());
	}

	public replaceTimezone(zoneOffsetInMinues:number){
		const offset=this.getTimezoneOffset();
		this.setUTCMinutes(this.getUTCMinutes()-offset+zoneOffsetInMinues);
		return this;
	}

	// public get milliseconds(){
	// 	return this.getMilliseconds();
	// }

	// public set milliseconds(v){
	// 	this.setMilliseconds(v);
	// }

	// public get seconds(){
	// 	return this.getSeconds();
	// }

	// public set seconds(v){
	// 	this.setSeconds(v);
	// }

	public daysInMonth(){
		return new Date(this.getFullYear(),this.getMonth()+1,0).getDate();
	}

	public get(unit:DateTime.StepUnit){
		if(unit==='millisecond')
			return this.getMilliseconds();
		if(unit==='second')
			return this.getSeconds();
		if(unit==='minute')
			return this.getMinutes();
		if(unit==='hour')
			return this.getHours();
		if(unit==='day')
			return this.getDate();
		if(unit==='month')
			return this.getMonth();
		if(unit==='year')
			return this.getFullYear();
		return null;
	}

	public set(unit:DateTime.StepUnit, v:number){
		if(unit==='millisecond')
			this.setMilliseconds(v);
		else if(unit==='second')
			this.setSeconds(v);
		else if(unit==='minute')
			this.setMinutes(v);
		else if(unit==='hour')
			this.setHours(v);
		else if(unit==='day')
			this.setDate(v);
		else if(unit==='month')
			this.setMonth(v);
		else if(unit==='year')
			this.setFullYear(v);
		return this;
	}

	public getUtc(unit:DateTime.StepUnit){
		if(unit==='millisecond')
			return this.getUTCMilliseconds();
		if(unit==='second')
			return this.getUTCSeconds();
		if(unit==='minute')
			return this.getUTCMinutes();
		if(unit==='hour')
			return this.getUTCHours();
		if(unit==='day')
			return this.getUTCDate();
		if(unit==='month')
			return this.getUTCMonth();
		if(unit==='year')
			return this.getUTCFullYear();
		return null;
	}

	public setUtc(unit:DateTime.StepUnit, v:number){
		if(unit==='millisecond')
			return this.setUTCMilliseconds(v);
		if(unit==='second')
			return this.setUTCSeconds(v);
		if(unit==='minute')
			return this.setUTCMinutes(v);
		if(unit==='hour')
			return this.setUTCHours(v);
		if(unit==='day')
			return this.setUTCDate(v);
		if(unit==='month')
			return this.setUTCMonth(v);
		if(unit==='year')
			return this.setUTCFullYear(v);
		return this;
	}

	public getFracSeconds(){
		return this.getSeconds()+this.getMilliseconds()/1000;
	}

	public setFracSeconds(v:number){
		let s=Math.floor(v);
		v=(v-s)*1000;
		let ms=Math.round(v);
		return this.setSeconds(s,ms);
	}

	public getFracMinutes(){
		return this.getMinutes()+this.getFracSeconds()/60;
	}

	public setFracMinutes(v:number){
		let m=Math.floor(v);
		v=(v-m)*60;
		let s=Math.floor(v);
		v=(v-s)*1000;
		let ms=Math.round(v);
		return this.setMinutes(m,s,ms);
	}

	public getFracHours(){
		return this.getHours()+this.getFracMinutes()/60;
	}

	public setFracHours(v:number){
		let h=Math.floor(v);
		v=(v-h)*60;
		let m=Math.floor(v);
		v=(v-m)*60;
		let s=Math.floor(v);
		v=(v-s)*1000;
		let ms=Math.round(v);
		return this.setHours(h,m,s,ms);
	}

	public getFracDate(){
		return this.getDate()+this.getFracHours()/60;
	}

	public setFracDate(v:number){
		let d=Math.floor(v);
		this.setDate(d);
		return this.setFracHours((v-d)*24);
	}

	public getFracMonth(){
		return this.getMonth()+this.getFracDate()/this.daysInMonth();
	}

	public setFracMonth(v:number){
		let m=Math.floor(v);
		v=(v-m)*this.daysInMonth();
		let d=Math.floor(v);
		this.setMonth(m,d);
		return this.setFracHours((v-d)*24);
	}

	public getFrac(unit:DateTime.StepUnit){
		if(unit==='millisecond')
			return this.getMilliseconds();
		if(unit==='second')
			return this.getFracSeconds();
		if(unit==='minute')
			return this.getFracMinutes();
		if(unit==='hour')
			return this.getFracHours();
		if(unit==='day')
			return this.getFracDate();
		if(unit==='month')
			return this.getFracMonth();
		return null;
	}

	public setFrac(unit:DateTime.StepUnit, v:number){
		if(unit==='millisecond')
			return this.setMilliseconds(v);
		if(unit==='second')
			return this.setFracSeconds(v);
		if(unit==='minute')
			return this.setFracMinutes(v);
		if(unit==='hour')
			return this.setFracHours(v);
		if(unit==='day')
			return this.setFracDate(v);
		if(unit==='month')
			return this.setFracMonth(v);
		return this.getTime();
	}

	public add(step:DateTime.Step){
		const [count,unit]=step;
		this.setUtc(unit,this.getUtc(unit)+count);
		return this;
	}

	public sub(step:DateTime.Step){
		const [count,unit]=step;
		this.setUtc(unit,this.getUtc(unit)-count);
		return this;
	}

	public lerp(that:DateTime, f:number){
		const a=this.getTime();
		const b=that.getTime();
		return new DateTime(a+(b-a)*f);
	}

	public floor(step:DateTime.Step){
		const [count,unit]=step;
		this.setFrac(unit,Math.floor(this.getFrac(unit)/count)*count);
		return this;
	}

	public ceil(step:DateTime.Step){
		const [count,unit]=step;
		this.setFrac(unit,Math.ceil(this.getFrac(unit)/count)*count);
		return this;
	}

	public equals(that:DateTime){
		return this.getTime()===that.getTime();
	}

	private toLocaleDiffStringSingle(prev:DateTime){
		const opts:Intl.DateTimeFormatOptions={
			hour12: false,
			year: '2-digit',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3,
		};
		if(prev){
			if(this.getFullYear()===prev.getFullYear())
				delete opts.year;
			if(this.getMonth()===prev.getMonth())
				delete opts.month;
			if(this.getDate()===prev.getDate())
				delete opts.day;
			if(this.getHours()===prev.getHours() && this.getMinutes()===prev.getMinutes()){
				delete opts.hour;
				delete opts.minute;
			}
			if(this.getSeconds()===prev.getSeconds())
				delete opts.second;
			if(this.getMilliseconds()===prev.getMilliseconds())
				delete opts.fractionalSecondDigits;
		}
		return this.toLocaleString(undefined,opts);
	}

	private toLocaleDiffStringSet(set:Iterable<DateTime>){
		const opts:Intl.DateTimeFormatOptions={
			hour12: false,
			year: '2-digit',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3,
		};

		const all=[...new Set([...set,this])];
		const years=new Set(all.map(v=>v.getFullYear()));
		const months=new Set(all.map(v=>v.getMonth()));
		const days=new Set(all.map(v=>v.getDate()));
		const hours=new Set(all.map(v=>v.getHours()));
		const minutes=new Set(all.map(v=>v.getMinutes()));
		const seconds=new Set(all.map(v=>v.getSeconds()));
		const milliseconds=new Set(all.map(v=>v.getMilliseconds()));
		if(years.size<2)
			delete opts.year;
		if(months.size<2)
			delete opts.month;
		if(days.size<2)
			delete opts.day;
		if(hours.size<2 && minutes.size<2){
			delete opts.hour;
			delete opts.minute;
		}
		if(seconds.size<2)
			delete opts.second;
		if(milliseconds.size<2)
			delete opts.fractionalSecondDigits;
		return this.toLocaleString(undefined,opts);
	}

	public toLocaleDiffString(prevOrSet:DateTime|(DateTime[])){
		if(Array.isArray(prevOrSet)){
			return this.toLocaleDiffStringSet(prevOrSet);
		}
		return this.toLocaleDiffStringSingle(prevOrSet);
	}

	public intervalTo(end:DateTime){
		return new DateTime.Range(this.clone(),end.clone());
	}
}

export namespace DateTime{
	export function equals(a:DateTime, b:DateTime){
		return a?.getTime()===b?.getTime();
	}

	export function daysInMonth(year:number, month:number){
		return new Date(year,month+1,0).getDate();
	}

	export type StepUnit=
		'millisecond'
		|'second'
		|'minute'
		|'hour'
		|'day'
		|'month'
		|'year'
	;

	const _stepUnits:Record<StepUnit,true>={
		millisecond: true,
		second: true,
		minute: true,
		hour: true,
		day: true,
		month: true,
		year: true,
	};

	export const stepUnits=Object.keys(_stepUnits);

	export namespace StepUnit{
		export function is(v:any):v is StepUnit{
			return typeof(v)==='string' && _stepUnits[<StepUnit>v];
		}

		//this table only contains a value if the milliseconds is consistant (basically no months or years)
		export const toMilliseconds:Record<StepUnit,number>={
			millisecond: 1,
			second: 1000,
			minute: 60*1000,
			hour: 60*60*1000,
			day: 24*60*60*1000,
			month: null,
			year: null,
		}
	}

	export type Step=[number,StepUnit];

	export namespace Step{
		export function toMilliseconds(step:Step){
			let ms=StepUnit.toMilliseconds[step[1]];
			if(ms===null)
				null;
			ms*=step[0];
			return ms;
		}
	}

	export class Range{
		public constructor(
			public begin=new DateTime(+8640000000000000),
			public end=new DateTime(-8640000000000000),
		){
		}

		public clone(){
			return new Range(this.begin.clone(),this.end.clone());
		}

		public get min(){
			return this.begin.getTime();
		}

		public set min(v){
			this.begin=new DateTime(v);
		}

		public get max(){
			return this.end.getTime();
		}

		public set max(v){
			this.end=new DateTime(v);
		}

		public expandByPoint(v:DateTime|number){
			if(v instanceof DateTime)
				v=v.getTime();
			if(this.min>v)
				this.min=v
			if(this.max<v)
				this.max=v
			return this;
		}
	
		public getParameter(p:DateTime|number){
			if(p instanceof DateTime)
				p=p.getTime();
			return (p-this.min)/(this.max-this.min);
		}

		public fromParameter(p:number){
			const t=this.min*(1-p)+this.max*p
			return new DateTime(t);
		}
	
		public div(step:Step){
			const ms=DateTime.Step.toMilliseconds(step);
			if(ms!==null)
				return (this.end.getTime()-this.begin.getTime())/ms;
			return null;
		}
	}
}
