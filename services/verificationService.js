/**
 * ==========================================================
 * services/verificationService.js
 * ANOR V13
 * Vérification complète d'un sceau
 * ==========================================================
 */

const ComparaisonV2 =
require("./comparaisonV2");

class VerificationService {

    constructor() {

        this.comparateur =
            new ComparaisonV2();

    }

    /*
    ==========================================================
    Vérification
    ==========================================================
    */

    verifier(lecture, candidats) {

        if (
            !lecture ||
            !Array.isArray(candidats)
        ) {

            return {

                success: false,

                authentique: false,

                score: 0,

                produit: null

            };

        }

        let meilleurProduit = null;

        let meilleurScore = 0;

        let meilleurDetail = null;

        for (const produit of candidats) {

            let reference =
                produit.bibliotheque_formes;

            if (typeof reference === "string") {

                try {

                    reference =
                        JSON.parse(reference);

                }

                catch {

                    reference = [];

                }

            }

            if (
                reference &&
                reference.glyphes
            ) {

                reference =
                    reference.glyphes;

            }

            const resultat =
                this.comparateur.comparer(

                    lecture.signature,

                    reference

                );

            const score =
                Number(resultat.score);

            if (
                score >
                meilleurScore
            ) {

                meilleurScore =
                    score;

                meilleurProduit =
                    produit;

                meilleurDetail =
                    resultat.details;

            }

        }

        return {

            success:
                meilleurScore >= 95,

            authentique:
                meilleurScore >= 95,

            score:
                meilleurScore,

            produit:
                meilleurProduit,

            details:
                meilleurDetail,

            diagnostic: {

                glyphesDetectes:
                    lecture.signature.length,

                glyphesReference:
                    meilleurProduit
                    ? (
                        Array.isArray(
                            meilleurProduit.bibliotheque_formes
                        )
                        ? meilleurProduit.bibliotheque_formes.length
                        : JSON.parse(
                            meilleurProduit.bibliotheque_formes
                        ).length
                    )
                    : 0

            }

        };

    }

}

module.exports =
VerificationService;