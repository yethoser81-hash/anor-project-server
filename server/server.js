const express = require('express');
const cors = require('cors');
const multer = require('multer'); 
const path = require('path'); 
require('dotenv').config();

const { enregistrerSceau, obtenirSceau } = require('./src/database.js');
const { limiterRequetes, validerPayloadScan, genererMatriceSecurite, forgerSceauSVG } = require('./src/security.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de Multer en mode mémoire
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite la taille de chaque fichier à 5 Mo maximum
    }
});

// Configuration des Middlewares globaux
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Servir le dossier public situé un niveau au-dessus
app.use(express.static(path.join(__dirname, '../public')));

/**
 * ROUTE 1 : Forge et Enregistrement d'un nouveau sceau
 * POST /api/sceau/enregistrer
 */
app.post('/api/sceau/enregistrer', upload.fields([
    { name: 'visuel_packaging', maxCount: 1 },
    { name: 'certificat_file', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id_sceau, id_produit, signature, metadata_raw } = req.body;
        
        const fichierImage = req.files && req.files['visuel_packaging'] ? req.files['visuel_packaging'][0] : null;
        const fichierPdf = req.files && req.files['certificat_file'] ? req.files['certificat_file'][0] : null;

        if (!id_produit || !signature) {
            return res.status(400).json({ 
                success: false, 
                message: "Données incomplètes. 'id_produit' et 'signature' sont requis." 
            });
        }

        // CORRECTION SÉCURITÉ : Si la signature reçue est un JWS Compact complexe,
        // on l'isole ou on extrait sa valeur lisible pour éviter d'insérer un jeton brut qui fait échouer Supabase.
        let signatureNettoiee = signature;
        if (signature.includes('.')) {
            // C'est un format JWS (Header.Payload.Signature). On extrait la partie signature visuelle ou un alias propre.
            const segments = signature.split('.');
            signatureNettoiee = `JWS_SIGNED_PART_${segments[2].substring(0, 10)}`;
        }

        // 1. Désérialisation sécurisée des métadonnées JSON
        let parsedMetadata = {};
        if (metadata_raw) {
            try {
                parsedMetadata = typeof metadata_raw === 'string' ? JSON.parse(metadata_raw) : metadata_raw;
            } catch (e) {
                console.warn("Format de metadata_raw invalide, enregistré comme objet vide.");
            }
        }

        // 2. Génération automatique de l'ID à 8 caractères s'il n'est pas fourni
        const finalIdSceau = id_sceau || Math.random().toString(36).substring(2, 10).toUpperCase();

        // 3. Génération automatique de la matrice géométrique binaire de 64 caractères
        const matriceBinaire = genererMatriceSecurite();

        // 4. Fabrication du fichier SVG physique contenant la stéganographie
        const svgSceauContenu = forgerSceauSVG(finalIdSceau, matriceBinaire);

        // 5. Enregistrement global dans Supabase
        const resultat = await enregistrerSceau(
            finalIdSceau, 
            id_produit, 
            signatureNettoiee, // Utilisation de la signature nettoyée et tolérée par le schéma
            matriceBinaire, 
            parsedMetadata, 
            fichierImage,
            fichierPdf 
        );

        if (resultat.success) {
            return res.status(201).json({ 
                success: true, 
                message: "Sceau certifié, packaging et certificat sauvegardés et ancrés avec succès.",
                donnees: {
                    id_sceau: finalIdSceau,
                    matrice_binaire: matriceBinaire,
                    svg: svgSceauContenu
                }
            });
        } else {
            if (resultat.error && resultat.error.code === '23505') {
                return res.status(409).json({ success: false, message: "Un sceau avec cet identifiant existe déjà." });
            }
            return res.status(500).json({ success: false, error: resultat.error });
        }
    } catch (err) {
        console.error("Erreur Forge :", err.message);
        return res.status(500).json({ success: false, message: "Erreur interne lors de la forge du sceau." });
    }
});

/**
 * ROUTE 2 : Vérification du Sceau sur le Terrain (Utilisée par l'APK)
 * POST /api/sceau/verifier
 */
app.post('/api/sceau/verifier', limiterRequetes, validerPayloadScan, async (req, res) => {
    const { id_sceau, matrice_scanne } = req.body;

    const resultat = await obtenirSceau(id_sceau);

    if (!resultat.success) {
        return res.status(500).json({ authentique: false, message: "Erreur technique temporaire lors de la vérification." });
    }

    if (!resultat.existe) {
        return res.status(404).json({
            authentique: false,
            statut_code: "INTROUVABLE",
            message: "ATTENTION : Ce sceau n'existe pas dans le registre officiel. Produit falsifié !"
        });
    }

    const { id_produit, signature, matrice_binaire, statut, metadata_raw, url_packaging, url_certificat } = resultat.donnees;

    if (statut !== 'valide') {
        return res.status(403).json({
            authentique: false,
            statut_code: statut.toUpperCase(),
            message: `ALERTE : Ce sceau a été marqué comme [${statut}]. Ne pas consommer.`
        });
    }

    if (matrice_binaire === matrice_scanne) {
        return res.json({
            authentique: true,
            statut_code: "VALIDE",
            message: "Authenticité confirmée. Produit certifié conforme.",
            details: { 
                id_produit,
                signature,
                url_packaging,
                url_certificat, 
                info_conformite: metadata_raw || {}
            }
        });
    } else {
        return res.status(401).json({
            authentique: false,
            statut_code: "CORROMPU",
            message: "ALERTE : La signature visuelle ne correspond pas. Tentative de duplication détectée !"
        });
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`[ANOR-CHECK] Serveur en ligne et actif sur le port ${PORT}`);
});