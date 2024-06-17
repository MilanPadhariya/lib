
export function autoUnsub() {
    return function(constructor:{new(...args:any[]):any}) {
        const orig=constructor.prototype.ngOnDestroy;
        constructor.prototype.ngOnDestroy=function(){
            for(const prop in this){
                const property=this[prop];
                if(typeof property.subscribe === "function") {
                    property.unsubscribe();
                }
            }
            orig.apply();
        }
    }
}