import { iterate } from '../iterate';
import '../stdext';
import { math } from '../math';

function context(got:{toString():string},wanted:{toString():string}){
	return ['got:    '+got.toString(),'wanted: '+wanted.toString()].join('\n');
}

const testData:{
	area: {
		triangle:math.Triangle3;
		area:number;
	}[];
	indicesFromThresholds: {
		values:[number,number,number];
		thresholds:number[];
		wanted:number[][];
	}[];
}={
	area: [
		{
			triangle: new math.Triangle3(
				new math.Vec3(0,0,5),
				new math.Vec3(5,0,5),
				new math.Vec3(2.5,5,5),
			),
			area: 12.5,
		},
	],

	indicesFromThresholds: [
		{
			values: [
				-0.27,
				0.49,
				1.4000000000000001
			],
			thresholds: [
				0,
				1,
				4,
				10
			],
			wanted: [
				[
					0.35526315789473684,
					1,
					1.5604395604395602,
					2.2395209580838324,
					2.838323353293413,
				],
				[
					1.5604395604395602,
					2,
					2.2395209580838324
				],
				[]
			]
		},
		{
			values: [
				1.21,
				1,
				0.29
			],
			thresholds: [
				0,
				1,
				4,
				10
			],
			wanted: [[1,2,2.7717391304347827],[0,1,2.7717391304347827],[]]
			,
		},
		{
			values: [
				-0.06,
				0.23,
				0.9
			],
			thresholds: [
				0,
				1,
				4,
				10
			],
			wanted: [
				[
					0.2068965517241379,
					1,
					2,
					2.9375
				],
				[],
				[]
			],
		},
		{
			values: [
				0.3,
				0.29,
				1
			],
			thresholds: [
				0,
				1,
				4,
				10
			],
			wanted: [
				[0,1,2],
				[],
				[],
			],
		}
	],

};

describe('math.Triangle3', () => {
	it('area',()=>{
		for(const {triangle,area:wanted} of testData.area){
			const got=triangle.getArea();
			expect(got===wanted)
				.withContext(context(got,wanted))
				.toBeTrue();
		}
	});

	it('indicesFromThresholds',()=>{
		for(const {values,thresholds,wanted} of testData.indicesFromThresholds){
			const got=math.Triangle3.indicesFromThresholds(values,thresholds);
			expect(JSON.stringify(got)===JSON.stringify(wanted))
				.withContext(context(JSON.stringify(got),JSON.stringify(wanted)))
				.toBeTrue();
		}
	});

	xit('divideByThresholds',()=>{
		for(const {triangle,area:wanted} of testData.area){
			const thresholds=[-Infinity,0.33,0.66,+Infinity];
			const polygons=triangle.divideByThresholds([0,1,2],thresholds);
			const got=iterate.sum(polygons.map(poly=>poly.convexArea()));
			expect(got===wanted)
				.withContext(context(got,wanted))
				.toBeTrue();
		}
	});

});
