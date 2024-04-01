export class ErrorRtrn{
	public constructor(
		public errors:string[]=[],
		public code=400,
	){
	}

	public toString(){
		return this.errors.join('\n');
	}
}
