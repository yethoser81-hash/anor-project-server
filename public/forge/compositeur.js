/**
 * compositeur.js
 * Responsable de la logique de construction du Sceau ANOR.
 * Il transforme une "clé" en une série de instructions de rendu.
 */

const G = require('./bibliotheque_glyphes.js');

const Compositeur = {
    // Définit les règles de placement (le "ADN" du sceau)
    composer: function(cle) {
        // La clé permet de transformer le chaos en ordre
        const seed = this.hashCle(cle);
        let instructions = [];

        // Logique de composition : distribution sur 3 anneaux
        const anneaux = [210, 160, 110];
        
        anneaux.forEach((rayon, rIndex) => {
            for (let i = 0; i < 20; i++) {
                // Sélection déterministe basée sur la clé
                const indexGlyphe = (seed + i + (rIndex * 20)) % G.length;
                
                instructions.push({
                    glyphe: G[indexGlyphe],
                    angle: (i / 20) * Math.PI * 2,
                    rayon: rayon
                });
            }
        });
        return instructions;
    },

    // Transforme une chaîne de caractères en un nombre pour la génération
    hashCle: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }
};

module.exports = Compositeur;