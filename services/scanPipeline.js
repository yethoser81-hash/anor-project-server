/**
 * ==========================================================
 * ANOR Scan Pipeline V15 - Avec Debug Comparaison
 * ==========================================================
 */

class ScanPipeline {

    constructor({
        vision,
        recherche,
        comparaison
    }){
        this.vision = vision;
        this.recherche = recherche;
        this.comparaison = comparaison;
    }

    async executer(image){

        const lecture =
            await this.vision.decoder(image);

        if(!lecture.success){
            return lecture;
        }

        const candidats =
            await this.recherche.rechercher(
                lecture
            );

        if(candidats.length===0){
            return{
                success:false,
                authentique:false,
                message:
                "Produit inconnu"
            };
        }

        /*
        ==========================================================
        BLOC TEMPORAIRE DE DÉBOGAGE & COMPARAISON
        ==========================================================
        */
        console.log("=== PREMIER AFFICHAGE (SCAN) ===");
        console.log(
            JSON.stringify(
                lecture.signature.slice(0, 5),
                null,
                2
            )
        );

        let meilleurScore = -1;
        let meilleurProduit = null;
        let derniereReferencePourDebug = null; // Pour capturer la référence du dernier produit testé

        for (const p of candidats) {
            const reference =
                typeof p.bibliotheque_formes === "string"
                    ? JSON.parse(p.bibliotheque_formes)
                    : p.bibliotheque_formes;

            derniereReferencePourDebug = reference; // Sauvegarde pour affichage juste après la boucle

            // Note : On utilise temporairement cette fonction locale ou importée pour le score.
            // Si comparerSignature n'est pas global, on appelle le module comparaison :
            const score = typeof comparerSignature === "function" 
                ? comparerSignature(lecture.signature, reference)
                : this.comparaison.comparerSignature(lecture.signature, reference);

            console.log("================================");
            console.log("PRODUIT :", p.nom_produit);
            console.log("SCAN :", lecture.signature.length);
            console.log("REFERENCE :", reference.length);
            console.log("SCORE :", score);
            console.log("================================");

            if (score > meilleurScore) {
                meilleurScore = score;
                meilleurProduit = p;
            }
        }

        console.log("=== DEUXIÈME AFFICHAGE (RÉFÉRENCE) ===");
        if (derniereReferencePourDebug) {
            console.log(
                JSON.stringify(
                    derniereReferencePourDebug.slice(0, 5),
                    null,
                    2
                )
            );
        } else {
            console.log("Aucune référence analysée.");
        }
        /*
        ==========================================================
        FIN DU BLOC DE DÉBOGAGE
        ==========================================================
        */

        // On rebranche le résultat sur le produit trouvé par notre boucle temporaire
        const resultat = {
            success: meilleurProduit !== null,
            authentique: meilleurScore > 0.8, // Seuil arbitraire de tolérance, ajuste-le au besoin
            score: meilleurScore,
            produit: meilleurProduit
        };

        if(!resultat.success){
            return {
                success: false,
                message: "Aucun produit correspondant trouvé."
            };
        }

        /*
        ==========================================================
        Extraction des informations produit
        ==========================================================
        */
        const produit =
            resultat.produit;

        return{
            success:true,
            authentique:resultat.authentique,
            score:resultat.score,
            produit:{
                id:produit.id,
                nom_produit:
                    produit.nom_produit,
                nom_producteur:
                    produit.nom_producteur,
                lot:
                    produit.lot,
                pays_origine:
                    produit.pays_origine,
                composition:
                    produit.composition,
                type_emballage:
                    produit.type_emballage,
                date_certificat_conformite:
                    produit.date_certificat_conformite,
                date_fabrication:
                    produit.date_fabrication,
                date_peremption:
                    produit.date_peremption,
                visuel_url:
                    produit.visuel_url,
                certificat_url:
                    produit.certificat_url
            }
        };
    }
}

module.exports = ScanPipeline;