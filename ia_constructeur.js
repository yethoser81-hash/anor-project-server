/**
 * ==========================================================
 * ia_constructeur.js - ANOR V7 (Version Production)
 * Rôle : Transforme les bits de la signature en glyphes 
 * concrets et vérifiables (forme + état).
 * ==========================================================
 */

const G = require("../public/forge/dessin_glyphes");

/**
 * Construit une séquence sécurisée.
 * Chaque bloc de 5 bits est converti en index, puis nous récupérons
 * le glyphe correspondant dans la bibliothèque.
 */
function construireSequence(bits) {
    if (!bits || bits.length === 0) return [];

    const sequence = [];
    // On traite par blocs de 5 bits pour une granularité de 32 combinaisons (2^5)
    for (let i = 0; i < bits.length; i += 5) {
        const bloc = bits.substring(i, i + 5);
        
        if (bloc.length === 5) {
            const idx = parseInt(bloc, 2) % G.length;
            const glyphe = G[idx];
            
            // Injection de métadonnées pour la vérification ultérieure par le serveur
            sequence.push({
                id: glyphe.id,
                nom: glyphe.forme, // Square, Circle, etc.
                est_plein: glyphe.plein, // Crucial pour l'intégrité du sceau
                valeur_reelle: glyphe.valeur
            });
        }
    }
    return sequence;
}

/**
 * Construit la bibliothèque complète pour un sceau.
 * Permet au serveur de comparer la structure totale [Noyau + Transition + Périphérie]
 */
function construireBibliotheque(bitsComplets) {
    // Vérification de l'intégrité (Rappel : 90 bits requis)
    if (bitsComplets.length < 90) {
        throw new Error("Erreur de sécurité : Séquence binaire incomplète (90 bits requis).");
    }

    return {
        noyau: construireSequence(bitsComplets.substring(0, 20)),
        transition: construireSequence(bitsComplets.substring(20, 50)),
        peripherie: construireSequence(bitsComplets.substring(50, 90))
    };
}

module.exports = { 
    construireSequence,
    construireBibliotheque 
};