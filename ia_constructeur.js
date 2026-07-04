/**
 * ==========================================================
 * forge/ia_constructeur.js
 * ANOR V7
 * Constructeur déterministe Bits → Glyphes
 * ==========================================================
 */

const GLYPHES = require("./forge/bibliotheque_glyphes");

/**
 * ==========================================================
 * Retourne un glyphe par son nom
 * ==========================================================
 */

function getGlyphe(nom) {
    if (!nom) return null;

    return GLYPHES.find(g => g.nom === nom) || null;
}

/**
 * ==========================================================
 * Retourne un glyphe par son indice
 * ==========================================================
 */

function getGlypheByIndex(index) {

    if (GLYPHES.length === 0) {
        return null;
    }

    index = Math.abs(index) % GLYPHES.length;

    return GLYPHES[index];
}

/**
 * ==========================================================
 * Glyphe aléatoire
 * (conservé uniquement pour les tests)
 * ==========================================================
 */

function randomGlyphe() {

    return getGlypheByIndex(

        Math.floor(
            Math.random() * GLYPHES.length
        )

    );

}

/**
 * ==========================================================
 * Ensemble aléatoire
 * (tests uniquement)
 * ==========================================================
 */

function randomSet(n = 5) {

    const resultat = [];

    for (let i = 0; i < n; i++) {

        resultat.push(randomGlyphe());

    }

    return resultat;

}

/**
 * ==========================================================
 * Filtre par forme
 * ==========================================================
 */

function filterByForme(forme) {

    return GLYPHES.filter(

        g => g.elements.some(

            e => e.forme === forme

        )

    );

}

/**
 * ==========================================================
 * Découpe une chaîne de bits
 * ==========================================================
 */

function chunkBits(bits, taille = 5) {

    const morceaux = [];

    for (let i = 0; i < bits.length; i += taille) {

        const morceau = bits.substring(i, i + taille);

        if (morceau.length === taille) {

            morceaux.push(morceau);

        }

    }

    return morceaux;

}

/**
 * ==========================================================
 * Conversion Bits → Séquence de Glyphes
 * ==========================================================
 */

function construireSequence(bits = "") {

    if (!bits || typeof bits !== "string") {

        return [];

    }

    const blocs = chunkBits(bits, 5);

    return blocs.map(bloc => {

        const indice = parseInt(bloc, 2);

        return getGlypheByIndex(indice);

    });

}

/**
 * ==========================================================
 * Conversion Signature complète (90 bits)
 * ==========================================================
 */

function construireBibliotheque(signature) {

    if (!signature || signature.length < 90) {

        throw new Error("Signature ANOR invalide.");

    }

    return {

        noyau:

            construireSequence(

                signature.substring(0, 20)

            ),

        transition:

            construireSequence(

                signature.substring(20, 50)

            ),

        peripherie:

            construireSequence(

                signature.substring(50, 90)

            )

    };

}

/**
 * ==========================================================
 * EXPORTS
 * ==========================================================
 */

module.exports = {

    getGlyphe,

    getGlypheByIndex,

    randomGlyphe,

    randomSet,

    filterByForme,

    construireSequence,

    construireBibliotheque

};