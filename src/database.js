const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Récupération des clés sécurisées depuis le fichier .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Erreur : Les variables SUPABASE_URL et SUPABASE_KEY doivent être définies dans le fichier .env");
    process.exit(1);
}

// Initialisation du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Enregistre un nouveau sceau généré par la forge dans Supabase
 */
async function enregistrerSceau(id_sceau, id_produit, signature, matrice_binaire) {
    try {
        const { data, error } = await supabase
            .from('sya_sceau')
            .insert([
                { 
                    id_sceau, 
                    id_produit, 
                    signature, 
                    matrice_binaire,
                    statut: 'valide'
                }
            ])
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Erreur d'enregistrement Supabase :", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Récupère les informations d'un sceau à partir de son ID pour vérification
 */
async function obtenirSceau(id_sceau) {
    try {
        const { data, error } = await supabase
            .from('sya_sceau')
            .select('id_produit, signature, matrice_binaire, statut')
            .eq('id_sceau', id_sceau)
            .single(); // On attend un seul résultat unique

        if (error) {
            if (error.code === 'PGRST116') {
                // Code Supabase pour "Aucun résultat trouvé"
                return { success: true, existe: false };
            }
            throw error;
        }

        return { success: true, existe: true, donnees: data };
    } catch (error) {
        console.error("Erreur de lecture Supabase :", error.message);
        return { success: false, error: error.message };
    }
}

// Export des fonctions pour qu'elles soient utilisables par le fichier server.js
module.exports = {
    enregistrerSceau,
    obtenirSceau
};