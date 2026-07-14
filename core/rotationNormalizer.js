/**
 * ==========================================================
 * core/rotationNormalizer.js
 * ANOR V17
 * Normalisation de la rotation
 * ==========================================================
 */

class RotationNormalizer {

    normaliser(glyphes){

        if(!glyphes || !glyphes.length)
            return [];

        const origine = glyphes
            .filter(g => g.anneau === 0)
            .sort((a,b)=>a.position-b.position)[0];

        if(!origine)
            return glyphes;

        const rotation = origine.angle;

        return glyphes.map(g=>{

            let angle = g.angle - rotation;

            while(angle < 0)
                angle += 360;

            while(angle >= 360)
                angle -= 360;

            return{

                ...g,

                angle

            };

        });

    }

}

module.exports = RotationNormalizer;