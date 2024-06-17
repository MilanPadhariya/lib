
export interface Request<AuthType,Body=Record<string,any>>{
	route:string;
	ip:string;
	port:string;
	auth:AuthType;
	body:Body;
}