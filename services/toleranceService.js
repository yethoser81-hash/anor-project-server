const ToleranceEngine =
require("../core/toleranceEngine");

class ToleranceService{

    constructor(){

        this.engine =
            new ToleranceEngine();

    }

    appliquer(scan,reference){

        return this.engine.filtrer(
            scan,
            reference
        );

    }

}

module.exports =
new ToleranceService();