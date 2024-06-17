import { TestBed, waitForAsync } from '@angular/core/testing';
import '../stdext';
import { math } from '../math';

function context(got:{toString():string},wanted:{toString():string}){
	return ['got:    '+got.toString(),'wanted: '+wanted.toString()].join('\n');
}

describe('math.Line2', () => {

	// beforeEach(waitForAsync(() => {
	// 	TestBed.configureTestingModule({
	// })
	// 	.compileComponents();
	// }));

	// beforeEach(() => {
	// });

	it('intersectionsWithCircle',()=>{
		const testData=[
			{
				line: new math.Line2(
					new math.Vec2(0,0),
					new math.Vec2(100,0),
				),
				circle: new math.Circle(new math.Vec2(50,25),50),
				wanted: [
					new math.Vec2(6.698729810778069,0),
					new math.Vec2(93.30127018922192,0),
				],
			},
			{
				line: new math.Line2(
					new math.Vec2(0,0),
					new math.Vec2(100,0),
				),
				circle: new math.Circle(new math.Vec2(50,75),50),
				wanted: [
				],
			},
			{
				line: new math.Line2(
					new math.Vec2(0,0),
					new math.Vec2(50,0),
				),
				circle: new math.Circle(new math.Vec2(50,25),50),
				wanted: [
					new math.Vec2(6.698729810778069,0),
				],
			},
		];
		for(const {line,circle,wanted} of testData){
			const got=line.intersectionsWithCircle(circle,false);
			expect(got.length===wanted.length && got.every((p,i)=>p.equals(wanted[i])))
				.withContext(context(got,wanted))
				.toBeTrue();
		}
		
	});
});
