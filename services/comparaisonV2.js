/**
 * ==========================================================
 * services/comparaisonV2.js
 * ANOR V13
 * Comparateur géométrique pondéré
 * ==========================================================
 */

const POIDS = {

    forme:40,

    plein:20,

    position:20,

    angle:10,

    rayon:10

};

const TOLERANCE_ANGLE = 8;

const TOLERANCE_RAYON = 12;

class ComparaisonV2 {

    /*
    ==========================================================
    Entrée principale
    ==========================================================
    */

    async comparerTous(lecture, candidats) {

        let meilleur = {
            score: 0,
            produit: null
        };

        for (const produit of candidats) {
            
            const scoreObj = this.comparer(
                lecture.glyphes,
                produit.glyphes
            );

            const score = parseFloat(scoreObj.score);

            if (score > meilleur.score) {
                meilleur = {
                    score: score,
                    produit: produit
                };
            }
        }

        return {

            success: true,

            authentique: meilleur.score >= 95,

            score: meilleur.score,

            produit: meilleur.produit

        };

    }

    comparer(scan, reference){

        if(
            !Array.isArray(scan) ||
            !Array.isArray(reference)
        ){

            return {

                score:0,

                details:null

            };

        }

        const index =
            this.creerIndex(scan);

        let scoreGlobal = 0;

        let maximum =
            reference.length * 100;

        let details = [];

        for(const ref of reference){

            const cle =
                this.cle(ref);

            const lu =
                index.get(cle);

            if(!lu){

                details.push({

                    position:cle,

                    score:0

                });

                continue;

            }

            const score =
                this.comparerGlyphe(
                    lu,
                    ref
                );

            scoreGlobal += score;

            details.push({

                position:cle,

                score

            });

        }

        return{

            score:Number(

                (
                    scoreGlobal /
                    maximum
                )*100

            ).toFixed(2),

            details

        };

    }

    /*
    ==========================================================
    Comparaison d'un glyphe
    ==========================================================
    */

    comparerGlyphe(scan,ref){

        let score = 0;

        /*
        Forme
        */

        if(
            scan.forme===ref.forme
        ){

            score += POIDS.forme;

        }

        /*
        Plein
        */

        if(
            scan.plein===ref.plein
        ){

            score += POIDS.plein;

        }

        /*
        Position
        */

        if(
            scan.position===ref.position
        ){

            score += POIDS.position;

        }

        /*
        Angle
        */

        let diffAngle =
            Math.abs(
                scan.angle-ref.angle
            );

        if(diffAngle>180){

            diffAngle =
                360-diffAngle;

        }

        if(
            diffAngle<=
            TOLERANCE_ANGLE
        ){

            score +=

                POIDS.angle *

                (
                    1-
                    diffAngle/
                    TOLERANCE_ANGLE
                );

        }

        /*
        Rayon
        */

        const diffRayon =
            Math.abs(
                scan.rayon-ref.rayon
            );

        if(
            diffRayon<=
            TOLERANCE_RAYON
        ){

            score +=

                POIDS.rayon *

                (
                    1-
                    diffRayon/
                    TOLERANCE_RAYON
                );

        }

        return score;

    }

    /*
    ==========================================================
    Index
    ==========================================================
    */

    creerIndex(glyphes){

        const map =
            new Map();

        for(const g of glyphes){

            map.set(

                this.cle(g),

                g

            );

        }

        return map;

    }

    /*
    ==========================================================
    Clé
    ==========================================================
    */

    cle(g){

        return

`${g.anneau}_${g.position}`;

    }

}

module.exports =
    ComparaisonV2;