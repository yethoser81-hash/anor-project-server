/**
 * ==========================================================
 * services/comparaisonService.js
 * ANOR V12
 * Moteur de comparaison géométrique
 * ==========================================================
 */

const ComparaisonV2 = require("./comparaisonV2");
const cacheSignature = require("./cacheSignature");
const comparateur = new ComparaisonV2();

class ComparaisonService {

    constructor() {
        this.seuilAuthenticite = 95;
    }

    comparer(scan, produits) {

        // 1. Vérification du cache avant toute comparaison
        const index = scan.index_geometrique.sha256;
        const deja = cacheSignature.get(index);
        if (deja) return deja;

        let meilleurProduit = null;
        let meilleurScore = 0;
        let meilleurDiagnostic = null;

        for (const produit of produits) {

            // S'assurer que la bibliothèque de formes est bien exploitée
            const reference = produit.bibliotheque_formes;
            if (!reference) continue;

            const resultat = comparateur.comparer(
                scan.signature,
                reference
            );
            
            const score = Number(resultat.score);

            if (score > meilleurScore) {
                meilleurScore = score;
                meilleurProduit = produit;
                meilleurDiagnostic = resultat.diagnostic;
            }
        }

        const resultatFinal = {
            authentique: meilleurScore >= this.seuilAuthenticite,
            score: meilleurScore,
            produit: meilleurProduit,
            diagnostic: {
                ...meilleurDiagnostic,
                glyphesDetectes: scan.signature.length,
                glyphesReference: meilleurProduit ? meilleurProduit.bibliotheque_formes.length : 0
            }
        };

        // 2. Mise en cache du résultat final
        cacheSignature.set(index, resultatFinal);

        return resultatFinal;
    }
}

module.exports = new ComparaisonService();