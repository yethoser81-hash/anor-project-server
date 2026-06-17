const express = require('express');
const cors = require('cors');
const multer = require('multer'); // Importation de multer pour gérer le téléversement de fichiers
const path = require('path'); // REQUIS : Pour gérer correctement les chemins de dossiers
require('dotenv').config();

// Importation de nos propres modules de données et de sécurité
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
app.use(cors()); // Autorise l'application mobile à requêter l'API à distance
app.use(express.json()); // Permet au serveur de comprendre les données au format JSON
app.use(express.urlencoded({ extended: true })); // Permet de comprendre les formulaires complexes (multipart)

// CORRECTION : Indique à Express où trouver le dossier public par rapport au sous-dossier server
app.use(express.static(path.join(__dirname, '../public')));

/**
 * ROUTE 1 : Forge et Enregistrement d'un nouveau sceau avec métadonnées, image du packaging ET certificat PDF
 * POST /api/sceau/enregistrer
 * Le middleware upload.fields intercepte les deux fichiers chargés simultanément dans la forge
 */
app.post('/api/sceau/enregistrer', upload.fields([
    { name: 'visuel_packaging', maxCount: 1 },
    { name: 'certificat_file', maxCount: 1 }
]), async (req, res) => {
    try {
        // Avec un envoi de type FormData, les textes arrivent dans req.body
        const { id_sceau, id_produit, signature, metadata_raw } = req.body;
        
        // Extraction des fichiers interceptés par Multer
        const fichierImage = req.files && req.files['visuel_packaging'] ? req.files['visuel_packaging'][0] : null;
        const fichierPdf = req.files && req.files['certificat_file'] ? req.files['certificat_file'][0] : null;

        // Validation rapide de la présence des champs essentiels pour la création
        if (!id_produit || !signature) {
            return res.status(400).json({ 
                success: false, 
                message: "Données incomplètes. 'id_produit' et 'signature' (nom/type) sont requis." 
            });
        }

        // 1. Désérialisation sécurisée des métadonnées JSON reçues du formulaire
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

        // 3. Génération automatique de la matrice géométrique binaire de 64 caractères (0 et 1)
        const matriceBinaire = genererMatriceSecurite();

        // 4. Fabrication du fichier SVG physique contenant la stéganographie
        const svgSceauContenu = forgerSceauSVG(finalIdSceau, matriceBinaire);

        // 5. Enregistrement global dans Supabase (Texte + JSON + Image + PDF)
        const resultat = await enregistrerSceau(
            finalIdSceau, 
            id_produit, 
            signature, 
            matriceBinaire, 
            parsedMetadata, 
            fichierImage,
            fichierPdf // Transmis à ta fonction database.js mise à jour précédemment
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
            // Gestion des collisions d'identifiants uniques
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

    // 1. Interroger le registre Supabase
    const resultat = await obtenirSceau(id_sceau);

    if (!resultat.success) {
        return res.status(500).json({ authentique: false, message: "Erreur technique temporaire lors de la vérification." });
    }

    // 2. Si le sceau n'existe pas du tout dans notre base
    if (!resultat.existe) {
        return res.status(404).json({
            authentique: false,
            statut_code: "INTROUVABLE",
            message: "ATTENTION : Ce sceau n'existe pas dans le registre officiel. Produit falsifié !"
        });
    }

    // Extraction de l'ensemble des informations d'authentification et de contrôle
    const { id_produit, signature, matrice_binaire, statut, metadata_raw, url_packaging, url_certificat } = resultat.donnees;

    // 3. Vérification de la validité administrative
    if (statut !== 'valide') {
        return res.status(403).json({
            authentique: false,
            statut_code: statut.toUpperCase(),
            message: `ALERTE : Ce sceau a été marqué comme [${statut}]. Ne pas consommer.`
        });
    }

    // 4. Cœur de la vérification physique
    if (matrice_binaire === matrice_scanne) {
        return res.json({
            authentique: true,
            statut_code: "VALIDE",
            message: "Authenticité confirmée. Produit certifié conforme.",
            details: { 
                id_produit,
                signature,
                url_packaging,
                url_certificat, // Transmet également le PDF à l'APK si nécessaire
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