/**
 * ==========================================================
 * services/indexManager.js
 * ANOR V14
 * Gestionnaire central de l'index mémoire
 * ==========================================================
 */

const ProduitService = require("./produitService");
const indexInverse = require("./indexInverse");

class IndexManager {

    constructor(supabase) {

        this.supabase = supabase;

        this.produitService =
            new ProduitService(supabase);

        this.estCharge = false;

        this.nbProduits = 0;

        this.derniereMAJ = null;

    }

    /*
    ==========================================================
    Chargement complet
    ==========================================================
    */

    async charger() {

        const produits =
            await this.produitService
                .chargerProduits();

        indexInverse.construire(produits);

        this.nbProduits =
            produits.length;

        this.derniereMAJ =
            new Date();

        this.estCharge = true;

        console.log(
            "[INDEX] chargé :",
            this.nbProduits,
            "produits"
        );

    }

    /*
    ==========================================================
    Rechargement
    ==========================================================
    */

    async recharger() {

        console.log(
            "[INDEX] rechargement..."
        );

        await this.charger();

    }

    /*
    ==========================================================
    Ajout immédiat
    ==========================================================
    */

    ajouter(produit) {

        produit = this.produitService.normaliserProduit(produit);

        if(
            !produit ||
            !produit.index_geometrique
        ){
            return;
        }

        indexInverse.ajouter(

            indexInverse.prefix16,

            produit.index_geometrique.prefix16,

            produit

        );

        indexInverse.ajouter(

            indexInverse.prefix24,

            produit.index_geometrique.prefix24,

            produit

        );

        indexInverse.sha256.set(

            produit.index_geometrique.sha256,

            produit

        );

        this.nbProduits++;

    }

    /*
    ==========================================================
    Recherche
    ==========================================================
    */

    rechercher(index){

        return indexInverse.rechercher(index);

    }

    /*
    ==========================================================
    Statistiques
    ==========================================================
    */

    infos(){

        return{

            charge:this.estCharge,

            produits:this.nbProduits,

            derniereMAJ:this.derniereMAJ

        };

    }

}

module.exports = IndexManager;