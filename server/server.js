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
        fileSize: 5 * 1024 * 1024 // Limite chaque fichier à 5 Mo
    }
});

// Middlewares globaux
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Dossier public
app.use(express.static(path.join(__dirname, '../public')));

/**
 * ROUTE : Forge et Enregistrement
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

        // --- CORRECTION SÉCURITÉ : Signature ---
        // On tronque et on nettoie pour garantir une insertion sans erreur de type
        let signatureNettoiee = String(signature).substring(0, 100); 
        if (signature.includes('.')) {
            const segments = signature.split('.');
            // On prend un segment court (max 20) pour éviter tout débordement
            signatureNettoiee = `SIG_${segments[2].substring(0, 20)}`;
        }

        // Désérialisation des métadonnées
        let parsedMetadata = {};
        if (metadata_raw) {
            try {
                parsedMetadata = typeof metadata_raw === 'string' ? JSON.parse(metadata_raw) : metadata_raw;
            } catch (e) {
                console.warn("Format de metadata_raw invalide, ignoré.");
            }
        }

        // Génération ID et Matrice
        const finalIdSceau = id_sceau || Math.random().toString(36).substring(2, 10).toUpperCase();
        const matriceBinaire = genererMatriceSecurite();
        const svgSceauContenu = forgerSceauSVG(finalIdSceau, matriceBinaire);

        // Appel DB
        const resultat = await enregistrerSceau(
            finalIdSceau, 
            id_produit, 
            signatureNettoiee, 
            matriceBinaire, 
            parsedMetadata, 
            fichierImage,
            fichierPdf 
        );

        if (resultat.success) {
            return res.status(201).json({ 
                success: true, 
                message: "Sceau certifié avec succès.",
                donnees: { id_sceau: finalIdSceau, matrice_binaire: matriceBinaire, svg: svgSceauContenu }
            });
        } else {
            return res.status(500).json({ success: false, error: resultat.error || "Erreur base de données" });
        }
    } catch (err) {
        console.error("Erreur Forge :", err.message);
        return res.status(500).json({ success: false, message: "Erreur interne lors de la forge." });
    }
});

/**
 * ROUTE : Vérification
 */
app.post('/api/sceau/verifier', limiterRequetes, validerPayloadScan, async (req, res) => {
    const { id_sceau, matrice_scanne } = req.body;
    const resultat = await obtenirSceau(id_sceau);

    if (!resultat.success) return res.status(500).json({ authentique: false, message: "Erreur technique." });
    if (!resultat.existe) return res.status(404).json({ authentique: false, message: "Sceau introuvable." });

    const { id_produit, signature, matrice_binaire, statut, metadata_raw, url_packaging, url_certificat } = resultat.donnees;

    if (statut !== 'valide') return res.status(403).json({ authentique: false, message: `Sceau status: ${statut}` });

    if (matrice_binaire === matrice_scanne) {
        return res.json({
            authentique: true,
            details: { id_produit, signature, url_packaging, url_certificat, info_conformite: metadata_raw }
        });
    } else {
        return res.status(401).json({ authentique: false, message: "Tentative de duplication détectée !" });
    }
});

app.listen(PORT, () => {
    console.log(`[ANOR-CHECK] Serveur actif sur le port ${PORT}`);
});