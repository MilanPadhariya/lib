import { geojson as _geojson } from "../geojson";

export namespace vectorTileFormat{
	export interface PointProps{
		c:string;
		r:number;
	}

	export interface LineProps{
		c:string;
		w:number;
	}

	export interface PolygonProps{
		f?:string;
		c?:string;
		w?:number;
	}

	export interface TextProps{
		text:string;
		fontFamily:string;
		fontSize:string;
		color:string;
		vertAlign:'middle'|'bottom'|'top'|'baseline';
		horzAlign:"center"|"left"|"right";
	}

	export type FeatureProps=PointProps|LineProps|PolygonProps|TextProps;

	export namespace geojson{
		export type PointFeature=_geojson.Feature<_geojson.GeometryPoint,PointProps>;
		export type LineFeature=_geojson.Feature<_geojson.GeometryLineString,LineProps>;
		export type TextFeature=_geojson.Feature<_geojson.GeometryPoint,TextProps>;
		export type PolygonFeature=_geojson.Feature<_geojson.GeometryMultiPolygon|_geojson.GeometryPolygon,PolygonProps>;

		export type Feature=PointFeature|LineFeature|PolygonFeature|TextFeature;
		export type FeatureCollection=_geojson.FeatureCollection<Feature>;
	}
}
