/**
 * ==========================================================
 * services/index.js
 * ANOR V15
 * Conteneur de services
 * ==========================================================
 */

const VisionService = require("./visionService");
const ProduitService = require("./produitService");
const RechercheIndex = require("./rechercheIndex");
const ComparaisonV2 = require("./comparaisonV2");
const ScanPipeline = require("./scanPipeline");
const IndexManager = require("./indexManager"); // Ajout de l'import

module.exports = function (supabase) {

    const indexManager = new IndexManager(supabase); // Initialisation
    const produitService = new ProduitService(supabase);
    const recherche = new RechercheIndex(indexManager); // Injection de l'indexManager
    const comparaison = new ComparaisonV2();

    const pipeline = new ScanPipeline({
        vision: VisionService,
        recherche,
        comparaison
    });

    return {
        produitService,
        recherche,
        comparaison,
        pipeline,
        indexManager // Ajout de l'export
    };

};