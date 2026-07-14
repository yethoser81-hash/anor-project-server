/**
 * ==========================================================
 * core/fingerprintEngine.js
 * ANOR V15
 * Construction de l'empreinte géométrique
 * ==========================================================
 */

class FingerprintEngine {

    /*
    ==========================================================
    Construction
    ==========================================================
    */

    construire(glyphes) {

        if (!Array.isArray(glyphes))
            return [];

        return glyphes
            .map(g => this.normaliser(g))
            .sort(this.trier)
            .map(g => this.encoder(g));

    }

    /*
    ==========================================================
    Normalisation
    ==========================================================
    */

    normaliser(g) {

        return {

            anneau:
                Number(g.anneau),

            position:
                Number(g.position),

            forme:
                g.forme,

            plein:
                !!g.plein,

            angle:
                Math.round(g.angle),

            rayon:
                Math.round(g.rayon)

        };

    }

    /*
    ==========================================================
    Encodage
    ==========================================================
    */

    encoder(g) {

        return [

            g.anneau,

            g.position,

            g.forme,

            g.plein ? 1 : 0,

            g.angle,

            g.rayon

        ].join(":");

    }

    /*
    ==========================================================
    Tri
    ==========================================================
    */

    trier(a,b){

        if(a.anneau!==b.anneau)
            return a.anneau-b.anneau;

        return a.position-b.position;

    }

}

module.exports = FingerprintEngine;