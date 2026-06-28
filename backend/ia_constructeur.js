/**
 * ============================================================
 * ia_constructeur.js
 * IA CONSTRUCTEUR ANOR V2
 * Transforme la signature binaire en bibliothèque graphique.
 * ============================================================
 */

const BIBLIOTHEQUE = require("./bibliotheque_formes");

function bitsToInt(bits) {
    return parseInt(bits, 2);
}

function construireAnneau(signature, debut, longueur, rayonBase) {

    const liste = [];

    for (let i = 0; i < longueur; i++) {

        const p = debut + i;

        const bloc = (
            signature +
            signature +
            signature
        ).substring(p, p + 8);

        const valeur = bitsToInt(bloc);

        const forme =
            BIBLIOTHEQUE[
                valeur % BIBLIOTHEQUE.length
            ];

        liste.push({

            id: i,

            bit: signature[p],

            forme: forme.nom,

            valeur: forme.valeur,

            taille:
                8 +
                (valeur % 18),

            rotation:
                valeur % 360,

            epaisseur:
                1 +
                (valeur % 3),

            plein:
                (valeur & 1) === 1,

            rayon:
                rayonBase +
                ((valeur >> 2) % 18) - 9,

            offset:
                ((valeur >> 5) % 9) - 4,

            couleur:
                valeur % 3,

            miroir:
                (valeur & 8) !== 0

        });

    }

    return liste;

}

function construireBibliotheque(signature) {

    if (!signature)
        throw new Error("Signature absente.");

    if (signature.length !== 90)
        throw new Error("Signature invalide.");

    return {

        noyau:
            construireAnneau(
                signature,
                0,
                20,
                230
            ),

        transition:
            construireAnneau(
                signature,
                20,
                30,
                325
            ),

        peripherie:
            construireAnneau(
                signature,
                50,
                40,
                430
            )

    };

}

module.exports = construireBibliotheque;