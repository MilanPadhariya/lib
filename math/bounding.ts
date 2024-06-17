import { Box2 } from './box2';
import { Vec2,Vec2Like } from './vec2';

export function alongAwayBox(points:Vec2Like[], along:Vec2, away:Vec2){
	const aa=new Vec2();
	const box=new Box2();
	for(const p of points){
		aa.x=along.dot(p);
		aa.y=away.dot(p);
		box.expandByPoint(aa);
	}
	return box;
}
