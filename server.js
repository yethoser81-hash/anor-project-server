const express = require('express');
const cors = require('cors');
const multer = require('multer'); // Importation de multer pour gérer le téléversement d'images
require('dotenv').config();

// Importation de nos propres modules de données et de sécurité
const { enregistrerSceau, obtenirSceau } = require('./src/database.js');
const { limiterRequetes, validerPayloadScan, genererMatriceSecurite, forgerSceauSVG } = require('./src/security.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de Multer en mode mémoire (on ne stocke pas le fichier sur le serveur Render, on le passe direct à Supabase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite la taille de l'image à 5 Mo maximum
    }
});

// Configuration des Middlewares globaux
app.use(cors()); // Autorise l'application mobile à requêter l'API à distance
app.use(express.json()); // Permet au serveur de comprendre les données au format JSON
app.use(express.urlencoded({ extended: true })); // Permet de comprendre les formulaires complexes (multipart)

// Route de diagnostic simple pour s'assurer que le serveur Render est bien éveillé
app.get('/', (req, res) => {
    res.json({ status: "online", system: "SYA ANOR-CHECK API", version: "1.1.0" });
});

/**
 * ROUTE 1 : Forge et Enregistrement d'un nouveau sceau avec métadonnées et image du packaging
 * POST /api/sceau/enregistrer
 * Le middleware upload.single('visuel_packaging') intercepte la photo chargée dans la forge
 */
app.post('/api/sceau/enregistrer', upload.single('visuel_packaging'), async (req, res) => {
    try {
        // Avec un envoi de type FormData, les textes arrivent dans req.body
        const { id_sceau, id_produit, signature, metadata_raw } = req.body;
        
        // Le fichier image intercepté par Multer se trouve dans req.file
        const fichierImage = req.file;

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

        // 5. Enregistrement global dans Supabase (Texte + JSON + Image transmise)
        const resultat = await enregistrerSceau(
            finalIdSceau, 
            id_produit, 
            signature, 
            matriceBinaire, 
            parsedMetadata, 
            fichierImage
        );

        if (resultat.success) {
            return res.status(201).json({ 
                success: true, 
                message: "Sceau certifié, packaging sauvegardé et ancré avec succès.",
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
 * Sécurisée par notre pare-feu IP (Rate-Limiter) et notre validateur de format strict
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
    const { id_produit, signature, matrice_binaire, statut, metadata_raw, url_packaging } = resultat.donnees;

    // 3. Vérification de la validité administrative (Sceau suspendu ou révoqué à distance)
    if (statut !== 'valide') {
        return res.status(403).json({
            authentique: false,
            statut_code: statut.toUpperCase(),
            message: `ALERTE : Ce sceau a été marqué comme [${statut}]. Ne pas consommer.`
        });
    }

    // 4. Cœur de la vérification physique : Comparaison de la matrice géométrique lue par la caméra
    if (matrice_binaire === matrice_scanne) {
        // L'APK reçoit ici le lot, les caractéristiques ET l'URL de la photo certifiée pour affichage immédiat
        return res.json({
            authentique: true,
            statut_code: "VALIDE",
            message: "Authenticité confirmée. Produit certifié conforme.",
            details: { 
                id_produit,
                signature,
                url_packaging, // Lien direct vers l'image dans le bucket Supabase Storage
                info_conformite: metadata_raw || {}
            }
        });
    } else {
        // Si les identifiants coïncident mais que la structure géométrique a été modifiée/mal copiée
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