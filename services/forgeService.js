/**
 * ==========================================================
 * services/forgeService.js
 * ANOR V15
 * Construction d'un produit forgé
 * ==========================================================
 */

const crypto = require("crypto");
const Compositeur = require("../public/forge/compositeur");
const GeometryIndex = require("../core/geometryIndex");

class ForgeService {

    genererNumeroForge() {

        const d = new Date();

        return (
            "ANOR-" +
            d.getFullYear() +
            String(d.getMonth() + 1).padStart(2, "0") +
            String(d.getDate()).padStart(2, "0") +
            "-" +
            crypto.randomBytes(4).toString("hex").toUpperCase()
        );

    }

    creer(data) {

        const {

            nom_produit,
            nom_producteur,
            lot,
            pays_origine,
            quantite

        } = data;

        const qte = parseInt(quantite || 1, 10);

        const signature = [

            nom_produit,
            nom_producteur,
            lot,
            pays_origine,
            qte

        ].join("_");

        const nonce =
            this.genererNumeroForge();

        const instructions =
            Compositeur.composer(
                signature,
                { zoneSerie: true }
            );

        const referenceGeometrique =
            GeometryIndex.build(

                instructions.map(g => ({

                    forme: g.glyphe.forme,
                    plein: g.glyphe.plein,
                    anneau: g.anneau,
                    position: g.position,
                    angle: g.angle * 180 / Math.PI,
                    rayon: g.rayon

                }))

            );

        const indexGeometrique = {

            version:
                referenceGeometrique.version,

            sha256:
                referenceGeometrique.sha256,

            prefix16:
                referenceGeometrique.prefix16,

            prefix24:
                referenceGeometrique.prefix24,

            nombreGlyphes:
                referenceGeometrique.nombreGlyphes

        };

        return {

            insertion: {

                nom_produit,
                nom_producteur,
                lot,
                pays_origine,

                quantite: qte,

                signature_maitre: signature,

                bibliotheque_formes: referenceGeometrique,
                index_geometrique: indexGeometrique,
                empreinte_geometrique: referenceGeometrique.sha256,

                nonce

            },

            nonce

        };

    }

}

module.exports = new ForgeService();