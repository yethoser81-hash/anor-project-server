/**
 * ==========================================================
 * core/recognitionEngine.js
 * ANOR V16
 * Reconnaissance hiérarchique
 * ==========================================================
 */

class RecognitionEngine {

    constructor() {

        this.MATCH_PARFAIT = 99;

        this.MATCH_EXCELLENT = 95;

        this.MATCH_BON = 90;

        this.MATCH_FAIBLE = 80;

    }

    classer(score) {

        if(score>=this.MATCH_PARFAIT){

            return{

                niveau:"PARFAIT",

                authentique:true

            };

        }

        if(score>=this.MATCH_EXCELLENT){

            return{

                niveau:"EXCELLENT",

                authentique:true

            };

        }

        if(score>=this.MATCH_BON){

            return{

                niveau:"BON",

                authentique:true

            };

        }

        if(score>=this.MATCH_FAIBLE){

            return{

                niveau:"A_VERIFIER",

                authentique:false

            };

        }

        return{

            niveau:"CONTREFACON",

            authentique:false

        };

    }

}

module.exports=RecognitionEngine;