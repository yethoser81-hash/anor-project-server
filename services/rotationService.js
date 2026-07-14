const RotationNormalizer =
require("../core/rotationNormalizer");

class RotationService{

    constructor(){

        this.normalizer =
            new RotationNormalizer();

    }

    normaliser(glyphes){

        return this.normalizer.normaliser(glyphes);

    }

}

module.exports =
new RotationService();