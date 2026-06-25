const BIBLIOTHEQUE = require('./bibliotheque_formes');

const SEED = 3;

function construireBibliotheque(signature) {

    if (!signature || signature.length < 90) {
        throw new Error(
            "Signature binaire invalide."
        );
    }

    const anneaux = [

        {
            nom: "noyau",
            debut: 0,
            taille: 20
        },

        {
            nom: "transition",
            debut: 20,
            taille: 30
        },

        {
            nom: "peripherie",
            debut: 50,
            taille: 40
        }

    ];

    const resultat = {};

    anneaux.forEach(anneau => {

        resultat[anneau.nom] = [];

        const segment = signature.substring(
            anneau.debut,
            anneau.debut + anneau.taille
        );

        for (let i = 0; i < segment.length; i++) {

            const bit =
                parseInt(segment[i], 10) || 0;

            const indexForme =
                (i + bit + SEED) %
                BIBLIOTHEQUE.length;

            resultat[anneau.nom].push({

                position: i,

                bit,

                forme:
                    BIBLIOTHEQUE[indexForme].nom,

                valeur:
                    BIBLIOTHEQUE[indexForme].valeur

            });

        }

    });

    return resultat;

}

module.exports = construireBibliotheque;