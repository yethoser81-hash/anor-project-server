/**
 * ==========================================================
 * ANOR Scan Pipeline V15
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

        const resultat =
            await this.comparaison.comparerTous(
                lecture,
                candidats
            );

        if(!resultat.success){
            return resultat;
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