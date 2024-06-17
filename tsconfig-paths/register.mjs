const module=require("module");

export function tsconfigPathsRegister(pathMap) {
    const originalResolveFilename=module._resolveFilename;
    module._resolveFilename=function(...args){
        const request=args[0];
        let match=pathMap[request];
        if(match)
            args[0]=match;
        return originalResolveFilename.apply(this, args);
    };
}
