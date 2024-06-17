
export interface Log{
	(level:'info'|'warn'|'error', ...message:{toString():string}[]):void;
	info(...message:{toString():string}[]):void;
	warn(...message:{toString():string}[]):void;
	error(...message:{toString():string}[]):void;
}
