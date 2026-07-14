const RecognitionEngine =
require("../core/recognitionEngine");

class RecognitionService{

    constructor(){

        this.engine=
            new RecognitionEngine();

    }

    analyser(resultat){

        if(!resultat){

            return{

                authentique:false,

                niveau:"AUCUN_RESULTAT",

                score:0

            };

        }

        const verdict=

            this.engine.classer(
                resultat.score
            );

        return{

            ...resultat,

            ...verdict

        };

    }

}

module.exports=
new RecognitionService();