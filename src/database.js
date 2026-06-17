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
 * Enregistre un nouveau sceau généré par la forge dans Supabase avec ses métadonnées, son visuel et son PDF
 * @param {string} id_sceau - L'ID unique à 8 caractères
 * @param {string} id_produit - L'ID du produit
 * @param {string} signature - La signature de l'entreprise
 * @param {string} matrice_binaire - La matrice géométrique
 * @param {Object} metadata_raw - Le bloc JSON des métadonnées du formulaire
 * @param {Object} fichierImage - Le fichier image intercepté par multer (visuel_packaging)
 * @param {Object} fichierPdf - Le fichier PDF intercepté par multer (certificat_file)
 */
async function enregistrerSceau(id_sceau, id_produit, signature, matrice_binaire, metadata_raw = {}, fichierImage = null, fichierPdf = null) {
    try {
        let url_packaging = null;
        let url_certificat = null;

        // 1. Gestion du téléversement de la Photo du Packaging
        if (fichierImage && fichierImage.buffer) {
            const nomFichierImg = `${id_sceau}_packaging.${fichierImage.originalname.split('.').pop()}`;
            
            const { error: imgError } = await supabase
                .storage
                .from('packagings')
                .upload(nomFichierImg, fichierImage.buffer, {
                    contentType: fichierImage.mimetype,
                    upsert: true
                });

            if (imgError) throw imgError;

            // Récupération de l'URL publique de la photo
            const { data: imgUrlData } = supabase
                .storage
                .from('packagings')
                .getPublicUrl(nomFichierImg);

            url_packaging = imgUrlData.publicUrl;
        }

        // 2. Gestion du téléversement du Certificat PDF
        if (fichierPdf && fichierPdf.buffer) {
            const nomFichierPdf = `${id_sceau}_certificat.pdf`;
            
            const { error: pdfError } = await supabase
                .storage
                .from('certificats')
                .upload(nomFichierPdf, fichierPdf.buffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (pdfError) throw pdfError;

            // Récupération de l'URL publique du PDF officiel
            const { data: pdfUrlData } = supabase
                .storage
                .from('certificats')
                .getPublicUrl(nomFichierPdf);

            url_certificat = pdfUrlData.publicUrl;
        }

        // 3. Insertion de la ligne complète dans la table sya_sceau avec les deux liaisons de stockage
        const { data, error } = await supabase
            .from('sya_sceau')
            .insert([
                { 
                    id_sceau, 
                    id_produit, 
                    signature, 
                    matrice_binaire,
                    metadata_raw,
                    url_packaging,   // Lien vers la photo dans le bucket 'packagings'
                    url_certificat,  // Lien vers le PDF dans le bucket 'certificats'
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
 * Récupère les informations d'un sceau à partir de son ID pour vérification (Utilisé par l'APK)
 */
async function obtenirSceau(id_sceau) {
    try {
        const { data, error } = await supabase
            .from('sya_sceau')
            .select('*') // Récupère tout, y compris metadata_raw, url_packaging et url_certificat
            .eq('id_sceau', id_sceau)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
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

module.exports = {
    enregistrerSceau,
    obtenirSceau
};