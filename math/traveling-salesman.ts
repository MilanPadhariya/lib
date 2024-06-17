import { Vec2 } from './vec2';

class TravelingSalesman{
	private readonly pointDistances:number[]=[];

	constructor(
		private readonly points:Vec2[],
	){
		//const ray=bestFit.ray2(this.points);
		//this.points.sort((a,b)=>ray.dir.dot(a)-ray.dir.dot(b));

		for(const a of points){
			for(const b of points)
				this.pointDistances.push(a.distTo(b));
		}
	}

	private bestOrder:number[]=[];
	private bestOrderDistance=Number.MAX_VALUE;

	private travelPaths(step:number, used:boolean[], order:number[], a:number, distanceTraveled:number){
		

		if(distanceTraveled>=this.bestOrderDistance)
			return;
		if(step>=this.points.length){
			if(this.bestOrderDistance>distanceTraveled){
				this.bestOrderDistance=distanceTraveled;
				this.bestOrder=[...order.values()];
			}
		}else{
			for(let b=0;b<this.points.length;++b){
				if(used[b])
					continue;
				order.push(b);
				used[b]=true;
				this.travelPaths(step+1,used,order,b,distanceTraveled+this.pointDistances[a*this.points.length+b]);
				used[b]=false;
				order.pop();
			}
		}
	}

	public solve(){
		const used=this.points.map(()=>false);

		console.time('travelingSalesman');
		for(let a=0;a<this.points.length;++a){
			for(let i=0;i<this.points.length;++i)
				used[i]=false;

			used[a]=true;
			const order=[a];
			this.travelPaths(1,used,order,a,0);
		}
		console.timeEnd('travelingSalesman');

		const distances:number[]=[];
		for(let i=1;i<this.bestOrder.length;++i){
			const a=this.bestOrder[i-1];
			const b=this.bestOrder[i];
			distances.push(this.pointDistances[a*this.points.length+b]);
		}
		return {
			points: this.bestOrder.map(i=>this.points[i]),
			order: this.bestOrder,
			distances,
			distance: this.bestOrderDistance,
		};
	}
};

//this function by definition is inefficent but sometimes needed
export function travelingSalesman(points:Vec2[]){
	const solver=new TravelingSalesman(points);
	const solution=solver.solve();
	return solution;
}
