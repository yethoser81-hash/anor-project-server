/**
 * ==========================================================
 * services/fingerprintService.js
 * ==========================================================
 */

const FingerprintEngine =
require("../core/fingerprintEngine");

class FingerprintService {

    constructor(){

        this.engine =
            new FingerprintEngine();

    }

    creer(glyphes){

        return this.engine
            .construire(glyphes);

    }

}

module.exports =
new FingerprintService();