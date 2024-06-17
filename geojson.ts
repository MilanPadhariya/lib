import { math } from './math';
import { angleABC } from './math/azimuth';

export namespace geojson{

	export type Coord=[number,number,...number[]];

	export function equals(a:Coord, b:Coord){
		return a.length===b.length && a.every((v,i)=>v===b[i]);
	}

	export function distanceSq(a:Coord, b:Coord){
		let sum=(a[0]-b[0])**2+(a[1]-b[1])**2;
		if(a.length>=3 && b.length>=3)
			sum+=(a[2]-b[2])**2;
		return sum;
	}
	
	export function distance(a:Coord, b:Coord){
		return math.sqrt(distanceSq(a,b));
	}

	export function distanceXYSq(a:Coord, b:Coord){
		return (a[0]-b[0])**2+(a[1]-b[1])**2;
	}
	
	export function distanceXY(a:Coord, b:Coord){
		return math.sqrt(distanceXYSq(a,b));
	}

	export function lerp(a:Coord, b:Coord, f:number){
		for(let i=0;i<a.length && i<b.length;++i)
			a[i]=math.lerp(a[i],b[i],f);
		return a;
	}
	
	export function azimuth(a:Coord, b:Coord){
		let angle=math.atan2(b[0]-a[0],b[1]-a[1]);
		if(angle<0)
			angle+=math.PI2;
		return angle;
	}

	export function areaSigned(a:geojson.Coord, b:geojson.Coord, c:geojson.Coord){
		return (a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]))/2;
	}

	export interface GeometryPoint{
		type:'Point';
		coordinates:Coord;
		radius?:number;//this is not a real part of the spec but used to say the point is actually circle, any other program that uses it will probably ignor it and make a point
		normal?:[number,number,number];//this is not a real part of the spec but again I need to represent a plane some how
	}

	export interface GeometryMultiPoint{
		type:'MultiPoint';
		coordinates:Coord[];
	}

	export interface GeometryLineString{
		type:'LineString';
		coordinates:Coord[];
	}

	export interface GeometryMultiLineString{
		type:"MultiLineString";
		coordinates:Coord[][];
	}

	export interface GeometryPolygon{
		type:'Polygon';
		coordinates:Coord[][];
	}

	export interface GeometryMultiPolygon{
		type:"MultiPolygon";
		coordinates:Coord[][][];
	}

	export interface GeometryCollection{
		type:"GeometryCollection";
		geometries:Geometry[];
		coordinates?:undefined;
	}

	export type Geometry=GeometryPoint|GeometryMultiPoint|GeometryLineString|GeometryMultiLineString|GeometryPolygon|GeometryMultiPolygon|GeometryCollection;
	export type GeometryCoordinates=Coord|Coord[]|Coord[][]|Coord[][][];

	export type FeatureId=string|number;

	export interface Feature<GeometryType=Geometry,Properties={[name:string]:any}>{
		id?: FeatureId,
		type:'Feature';
		geometry:GeometryType;
		properties?:Properties;
	}

	export interface FeatureCollection<FeatureType=Feature>{
		type:'FeatureCollection';
		features:FeatureType[];
		crs?:{
			type:'name'|'EPSG';
			properties?:{[name:string]:any}
		}
	}

	type GeometryContainer=Feature|FeatureCollection|Geometry;
	/*
		probably should add a validator
	*/

	function *_iterateGeometries(geojson:Geometry){
		if(geojson.type==='GeometryCollection')
			yield *geojson.geometries;
		else
			yield geojson;
	}

	export function *iterateGeometries(geojson:GeometryContainer){
		if(geojson.type==='Feature'){
			yield *_iterateGeometries(geojson.geometry);
		}else if(geojson.type==='FeatureCollection'){
			for(const f of geojson.features)
				yield *_iterateGeometries(f.geometry);
		}else{
			yield *_iterateGeometries(geojson);
		}
	}

	export function *iteratePolygons(geom:GeometryPolygon|GeometryMultiPolygon){
		if(geom.type==='Polygon'){
			yield geom.coordinates;
		}else{
			for(const polygon of geom.coordinates){
				yield polygon;
			}
		}
	}

	export function *iterateCoords(geojson:GeometryContainer):Generator<Coord,void,undefined>{
		for(const geom of iterateGeometries(geojson)){
			if(geom.type==='Polygon'){
				for(const coords of geom.coordinates)
					yield *coords;
			}else if(geom.type==='LineString'){
				yield *geom.coordinates;
			}else if(geom.type==='Point'){
				yield geom.coordinates;
			}else if(geom.type==='MultiPoint'){
				yield *geom.coordinates;
			}else if(geom.type==='MultiLineString'){
				for(const coords of geom.coordinates)
					yield *coords;
			}else if(geom.type==='MultiPolygon'){
				for(const polygon of geom.coordinates){
					for(const coords of polygon)
						yield *coords;
				}
			}
		}
		yield *[];
	}

	export function coords(geojson:GeometryContainer){
		return [...iterateCoords(geojson)];
	}

	export function length(
		geojson:GeometryContainer,
		converter?:((coord:Coord)=>Coord),
		maxComponent=3
	){
		let length=0;
		for(const geom of iterateGeometries(geojson)){
			let coords:Coord[]=[];
			if(geom.type==='LineString')
				coords=geom.coordinates;
			else if(geom.type==='Polygon')
				coords=geom.coordinates[0];
			if(converter)
				coords=coords.map(p=>converter(p));

			for(const [a,b] of coords.pairs()){
				let stepLength=0;
				for(let i=0;i<a.length && i<b.length && i<maxComponent;++i)
					stepLength+=(a[i]-b[i])**2;
				
				length+=math.sqrt(stepLength);
			}
		}
		return length;
	}

	export function angles(
		geojson:GeometryContainer,
		converter?:((coord:Coord)=>Coord),
	){

		let angles:number[]=[];
		for(const geom of iterateGeometries(geojson)){
			let coords:Coord[]=[];
			if(geom.type==='LineString')
				coords=geom.coordinates;
			else if(geom.type==='Polygon')
				coords=geom.coordinates[0];

			if(coords.length<3)
				continue;

			if(converter)
				coords=coords.map(p=>converter(p));

			for(const [a,b,c] of coords.triplets()){
				const vecA=new math.Vec2().fromArray(a);
				const vecC=new math.Vec2().fromArray(c);
				const vecB=new math.Vec2().fromArray(b);

				angles.push(angleABC(vecA,vecB,vecC));
			}
		}
		return angles;
	}

	export function lengthXY(
		geojson:GeometryContainer,
		converter?:((coord:Coord)=>Coord),
	){
		return length(geojson,converter,2);
	}

	export interface Lengths{
		twoD?:number;
		threeD?:number;
	}

	export function lengths(
		geojson:GeometryContainer,
		converter:((coord:Coord)=>Coord),
	){

		let lengths:Lengths={};
		for(const geometry of iterateGeometries(geojson)){
			let coordinates:Coord[]|undefined;
			if(geometry.type==='LineString')
				coordinates=geometry.coordinates;
			else if(geometry.type==='Polygon')
				coordinates=geometry.coordinates[0];

			if(coordinates){
				let points=coordinates.map(p=>new math.Vec3().fromArray(converter(<Coord>p.slice())));
				for(let i=1;i<points.length;++i){
					let a=points[i-1];
					let b=points[i];

					lengths.twoD=lengths.twoD || 0;
					lengths.threeD=lengths.threeD || 0;

					let stepLength=Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
					lengths.twoD+=stepLength;
					if(a.z!==undefined && b.z!==undefined)
						lengths.threeD+=a.distanceTo(b);
					else
						lengths.threeD+=stepLength;
				}
			}
		}
		return lengths;
	}

	// export function area(
	// 	geojson:GeometryContainer,
	// 	converter:((coord:Coord)=>Coord),
	// ){
	// 	let area=0;
	// 	for(const geometry of iterateGeometries(geojson)){
	// 		if(geometry.type==='Polygon'){
	// 			let triangles=math.triangulate(geometry.coordinates[0].map(p=>new math.Vec2().fromArray(converter(p))));
	// 			triangles.forEach(triangle=>area+=triangle.area());
	// 		}
	// 	}
	// 	return area;
	// }

	export function transform<T extends GeometryContainer>(geojson:T, converter:(coord:Coord)=>Coord):T;
	export function transform(geojson:GeometryContainer, converter:(coord:Coord)=>Coord){
		if(geojson.type==='FeatureCollection'){
			geojson.features.forEach(feature=>transform(feature,converter));
		}else if(geojson.type==='Feature'){
			transform(geojson.geometry,converter);
		}else if(geojson.type==='GeometryCollection'){
			geojson.geometries.forEach(geometry=>transform(geometry,converter));
		}else if(geojson.type==='Point'){
			geojson.coordinates=converter(geojson.coordinates);
		}else if(geojson.type==='LineString'){
			const coordinates=geojson.coordinates;
			for(let i=0;i<coordinates.length;++i)
				coordinates[i]=converter(coordinates[i]);
		}else if(geojson.type==='MultiLineString'){
			for(const line of geojson.coordinates){
				for(let i=0;i<line.length;++i)
					line[i]=converter(line[i]);
			}
		}else if(geojson.type==='MultiPoint'){
			const coordinates=geojson.coordinates;
			for(let i=0;i<coordinates.length;++i)
				coordinates[i]=converter(coordinates[i]);
		}else if(geojson.type==='MultiPolygon'){
			for(const polygon of geojson.coordinates){
				for(const loop of polygon){
					for(let i=0;i<loop.length;++i)
						loop[i]=converter(loop[i]);
				}
			}
		}else if(geojson.type==='Polygon'){
			for(const loop of geojson.coordinates){
				for(let i=0;i<loop.length;++i)
					loop[i]=converter(loop[i]);
			}
		}
		return geojson;
	}

	export function translate<T extends GeometryContainer>(geojson:T, translation:Coord):T;
	export function translate(geojson:GeometryContainer, translation:Coord){
		return transform(geojson,coord=>{
			let l=Math.min(coord.length,translation.length);
			for(let i=0;i<l;++i){
				coord[i]+=translation[i];
			}
			return coord;
		});
	}

	function cleanCoords(coords:Coord[]){
		const _coords=coords.filter((p,i,a)=>{
			if(i===0)
				return true;
			const q=a[i-1];
			return !equals(p,q);
		});
		coords.length=0;
		coords.push(..._coords);
	}

	export function clean(geom:Geometry){
		if(geom.type==='LineString'){
			cleanCoords(geom.coordinates);
		}else if(geom.type==='Polygon'){
			for(const ring of geom.coordinates){
				cleanCoords(ring);
				if(ring.length>=3 && !equals(ring.at(-1)!,ring.at(0)!))
					ring.push(<Coord>ring.at(0)!.slice());
			}
		}else if(geom.type==='MultiLineString'){
			geom.coordinates.forEach(coords=>cleanCoords(coords));
		}else if(geom.type==='MultiPolygon'){
			for(const polygon of geom.coordinates){
				for(const ring of polygon){
					cleanCoords(ring);
					if(ring.length>=3 && !equals(ring.at(-1)!,ring.at(0)!))
						ring.push(<Coord>ring.at(0)!.slice());
				}
			}
		}
		return geom;
	}

	function cross(a:Coord, b:Coord, c:Coord):number{
		return (b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
	}

	function coordsContain(coords:Coord[], coord:Coord):boolean{
		let wn=0; // winding number
		for(let i=0;i<coords.length;++i){
			const a=coords[i];
			const b=coords[(i+1)%coords.length];
			if(a[1]<=coord[1]){
				if(b[1]>coord[1] && cross(a,b,coord)>0)
					wn+=1;
			}else if(b[1]<=coord[1] && cross(a,b,coord)<0)
				wn-=1;
		}
		return wn!==0;
	}

	function polygonContains(coords:Coord[][], coord:Coord){
		if(coordsContain(coords[0],coord)){
			for(let i=1;i<coords.length;++i){
				if(coordsContain(coords[i],coord))
					return false;
			}
			return true;
		}
		return false;
	}

	export function contains(geojson:GeometryContainer, coord:Coord){
		for(const geom of iterateGeometries(geojson)){
			if(geom.type==='Polygon'){
				if(polygonContains(geom.coordinates,coord))
					return true;
			}else if(geom.type==='MultiPolygon'){
				for(const coords of geom.coordinates){
					if(polygonContains(coords,coord))
						return true;
				}
			}
		}
		return false;
	}

	export function isClockwise(polygon:Coord[]) {
		if(!polygon || polygon.length < 3) return null;

		const end=polygon.length - 1;
		let area=polygon[end][0] * polygon[0][1] - polygon[0][0] * polygon[end][1];

		for(let i=0; i<end; ++i){
			const n=i+1;
			area+=polygon[i][0] * polygon[n][1] - polygon[n][0] * polygon[i][1];
		}

		return area > 0;
	}
}
