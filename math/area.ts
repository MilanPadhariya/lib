import {triangulatePolygon} from '../triangulate';
import {Vec2} from './vec2';

export function area(shape:Vec2[]){
	let area=0;
	let triangles=triangulatePolygon(shape);
	triangles.forEach(triangle=>area+=triangle.area());
	return area;
}
