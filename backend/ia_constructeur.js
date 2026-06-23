const crypto = require('crypto');
const BIBLIOTHEQUE = require('./bibliotheque_formes');

const SEED = 3; // 🔒 verrouillage système

function construireBibliotheque(signature) {

    const anneaux = [
        { nom: "noyau", debut: 0, taille: 20 },
        { nom: "transition", debut: 20, taille: 30 },
        { nom: "peripherie", debut: 50, taille: 40 }
    ];

    const resultat = {};

    anneaux.forEach(anneau => {

        resultat[anneau.nom] = [];

        const segment = signature.substring(
            anneau.debut,
            anneau.debut + anneau.taille
        );

        for (let i = 0; i < segment.length; i++) {

            const bit = parseInt(segment[i]) || 0;

            // Utilise 3 bits pour rendre la répartition des formes plus riche
            const groupeBits = signature
                .substring(anneau.debut + i, anneau.debut + i + 3)
                .padEnd(3, '0');

            // Logique de verrouillage déterministe (Standard Officiel)
            const indexForme = (i + bit + SEED) % 8;

            resultat[anneau.nom].push({

                position: i,

                bit: bit,

                forme: BIBLIOTHEQUE[indexForme].nom,

                valeur: BIBLIOTHEQUE[indexForme].valeur

            });

        }

    });

    return resultat;
}

module.exports = construireBibliotheque;