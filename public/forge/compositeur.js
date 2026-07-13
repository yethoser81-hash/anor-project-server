/**
 * compositeur.js (Mis à jour)
 */

let G;
if (typeof module !== "undefined" && module.exports) {
    G = require("./bibliotheque_glyphes.js");
} else {
    G = window.BIBLIOTHEQUE_GLYPHES;
}

const Compositeur = {

    composer(cle, options = {}) {
        const seed = this.hashCle(cle);
        let instructions = [];

        // 3 anneaux avec des rayons plus variés pour la dynamique
        const rayons = [210, 165, 120];
        const densites = [34, 28, 22];

        rayons.forEach((rayon, r) => {
            const nb = densites[r];

            for (let i = 0; i < nb; i++) {
                
                // --- ZONE DE SILENCE CENTRALE ---
                // On empêche tout glyphe de se trouver trop près du centre (ex: rayon < 100)
                if (rayon < 100) continue;

                // Espace pour le numéro de série (Zone basse)
                if (options.zoneSerie && r === 0) {
                const angleDeg = (i / nb) * 360;
                if (angleDeg > 250 && angleDeg < 290) {
                continue;
                }
                }

                // --- VARIABILITÉ DE TAILLE (Nuance dynamique) ---
                // On utilise le seed pour faire varier l'échelle entre 0.8 et 1.4
                const variation = ((seed + i + r) % 5) / 10 + 0.8;
                
                // Espacement aléatoire contrôlé
                if (((seed + i + r) % 11) === 0) continue;

                const angle = (i / nb) * Math.PI * 2;
                const index = (seed + i * 9 + r * 17) % G.length;

                instructions.push({

                glyphe:G[index],

                angle,

                rayon,

                echelle:variation,

                anneau:r,

                position:i

                });
            }
        });

        return instructions;
    },

    hashCle(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }
};

if (typeof module !== "undefined") module.exports = Compositeur;
if (typeof window !== "undefined") window.Compositeur = Compositeur;