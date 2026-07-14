const GeometryMatcher = require("../core/geometryMatcher");
const graphService = require("./graphService");
const rotationService = require("./rotationService");
const toleranceService = require("./toleranceService");
const toleranceEngine = require("./toleranceEngine");

class MatchingService {

    constructor() {
        this.matcher = new GeometryMatcher();
    }

    comparer(scan, candidats) {
        let meilleur = null;
        let meilleurScore = 0;

        // Normalisation unique du scan avant la boucle
        const scanNormalise = rotationService.normaliser(scan);

        for (const produit of candidats) {
            // Normalisation de la référence
            let reference = rotationService.normaliser(produit.glyphes);
            let scanCourant = [...scanNormalise];

            // Application de la tolérance
            scanCourant = toleranceService.appliquer(scanCourant, reference);

            // Calcul géométrique (70%)
            const geo = this.matcher.comparer(scanCourant, reference);
            
            // Calcul structurel/graphique (30%)
            const graph = graphService.comparer(scanCourant, reference);

            // Score initial pondéré
            let score = (geo.score * 0.70) + (graph.score * 0.30);

            // Calcul et application des pénalités
            let penalite = 0;
            for (const g of scanCourant) {
                penalite += toleranceEngine.penalite(g);
            }

            score -= penalite;
            if (score < 0) score = 0;

            if (score > meilleurScore) {
                meilleurScore = score;
                meilleur = {
                    produit,
                    score,
                    correspondances: geo.correspondances
                };
            }
        }

        return meilleur;
    }
}

module.exports = new MatchingService();