/**
 * ==========================================================
 * services/produitService.js
 * ANOR V14
 * Recherche ciblée des produits certifiés
 * ==========================================================
 */

class ProduitService {

    constructor(supabase) {
        this.supabase = supabase;
    }

    async chargerProduits() {
        const { data, error } = await this.supabase
            .from("sya_produit_certifie")
            .select(`
                id,
                nom_produit,
                nom_producteur,
                lot,
                pays_origine,
                nonce,
                bibliotheque_formes,
                index_geometrique,
                empreinte_geometrique
            `);

        if (error) throw error;

        return (data || []).map(p => this.normaliserProduit(p));
    }

    async rechercherParIndex(prefix16) {
        const { data, error } = await this.supabase
            .from("sya_produit_certifie")
            .select(`
                id, nom_produit, nom_producteur, lot, pays_origine, 
                composition, type_emballage, date_certificat_conformite, 
                date_fabrication, date_peremption, visuel_url, 
                certificat_url, nonce, bibliotheque_formes, 
                index_geometrique, empreinte_geometrique
            `)
            .eq("index_geometrique->>prefix16", prefix16);

        if (error) throw error;
        return (data || []).map(p => this.normaliserProduit(p));
    }

    async rechercherParPrefix24(prefix24) {
        const { data, error } = await this.supabase
            .from("sya_produit_certifie")
            .select(`
                id, nom_produit, nom_producteur, lot, pays_origine, 
                composition, type_emballage, date_certificat_conformite, 
                date_fabrication, date_peremption, visuel_url, 
                certificat_url, nonce, bibliotheque_formes, 
                index_geometrique, empreinte_geometrique
            `)
            .eq("index_geometrique->>prefix24", prefix24);

        if (error) throw error;
        return (data || []).map(p => this.normaliserProduit(p));
    }

    normaliserProduit(produit) {
        let reference = produit.bibliotheque_formes;
        if (typeof reference === "string") {
            try { reference = JSON.parse(reference); } catch { reference = []; }
        }
        if (reference && reference.glyphes && Array.isArray(reference.glyphes)) {
            reference = reference.glyphes;
        }
        return {
            id: produit.id,
            nom_produit: produit.nom_produit,
            nom_producteur: produit.nom_producteur,
            lot: produit.lot,
            pays_origine: produit.pays_origine,
            composition: produit.composition,
            type_emballage: produit.type_emballage,
            date_certificat_conformite: produit.date_certificat_conformite,
            date_fabrication: produit.date_fabrication,
            date_peremption: produit.date_peremption,
            visuel_url: produit.visuel_url,
            certificat_url: produit.certificat_url,
            nonce: produit.nonce,
            glyphes: Array.isArray(reference) ? reference : [],
            index_geometrique: produit.index_geometrique,
            empreinte_geometrique: produit.empreinte_geometrique
        };
    }
}

module.exports = ProduitService;