require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const app = express();

/* ==========================================
   1. SÉCURITÉ & CONFIGURATION INITIALE
========================================== */

const verifLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50, 
    message: { success: false, message: "Trop de tentatives. Réessayez dans 15 min." }
});

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non autorisé. Images uniquement.'));
        }
    },
    limits: { 
        fileSize: 5 * 1024 * 1024 
    }
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const ANOR_SECRET = process.env.ANOR_SECRET;
if (!ANOR_SECRET) {
    console.error("ERREUR : ANOR_SECRET manquante dans .env");
    process.exit(1);
}

app.use(cors({ origin: '*' })); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


/* ==========================================
   2. ROUTES DE BASE & ÉTAT DU SERVICE
========================================== */
app.get('/api/status', (req, res) => {
    res.json({ 
        success: true, 
        service: "ANOR Conformity Check API", 
        version: "1.2.0",
        status: "online",
        timestamp: new Date()
    });
});


/* ==========================================
   3. FORGE (IDENTIFICATION & SIGNATURE BINAIRE)
========================================== */
app.post('/api/produit/enregistrer', async (req, res) => {
    try {
        const {
            nom_produit,
            nom_producteur,
            lot,
            pays_origine,
            url_visuel,
            type_emballage 
        } = req.body;

        if (!nom_produit || !nom_producteur || !lot || !pays_origine) {
            return res.status(400).json({ success: false, message: "Champs requis manquants." });
        }

        const { data: existing } = await supabase
            .from('sya_produit_certifie')
            .select('id')
            .eq('nom_produit', nom_produit)
            .eq('lot', lot)
            .single();

        if (existing) {
            return res.status(409).json({ success: false, message: "Ce lot de produit est déjà enregistré." });
        }

        // --- GÉNÉRATION DE LA SIGNATURE CRYPTOGRAPHIQUE BINAIRE LISSÉE ---
        const salt = Date.now().toString();
        const hmacBuffer = crypto
            .createHmac('sha256', ANOR_SECRET)
            .update(`${nom_produit}-${nom_producteur}-${lot}-${salt}`)
            .digest();

        // Conversion du buffer en chaîne de bits pure (0 et 1)
        let signatureBinaire = "";
        for (const byte of hmacBuffer) {
            signatureBinaire += byte.toString(2).padStart(8, '0');
        }

        // Segmentation stricte des bits pour correspondre aux rayons géométriques (Total: 90 bits)
        const produitData = {
            nom_produit,
            nom_producteur,
            lot,
            pays_origine,
            visuel_url: url_visuel || 'p_default.png',
            type_emballage: type_emballage || "Non spécifié",
            
            code_sceau: signatureBinaire, 
            segment_noyau: signatureBinaire.substring(0, 20),       // 20 bits
            segment_transition: signatureBinaire.substring(20, 50),  // 30 bits
            segment_peripherie: signatureBinaire.substring(50, 90),  // 40 bits
        };

        const { error } = await supabase
            .from('sya_produit_certifie')
            .insert([produitData]);

        if (error) throw error;

        res.json({
            success: true,
            message: "Produit enregistré avec succès.",
            code_sceau: signatureBinaire,
            structure_sceau: {
                noyau: produitData.segment_noyau,
                transition: produitData.segment_transition,
                peripherie: produitData.segment_peripherie
            }
        });

    } catch (err) {
        console.error("Erreur Enregistrement:", err);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }
});


/* ==========================================
   4. MOTEUR DE LECTURE OPTIQUE IA PYTHON (COMMUNICATION)
========================================== */
const { exec } = require('child_process');
const fs = require('fs');

function getHammingDistance(s1, s2) {
    let d = 0;
    for(let i = 0; i < s1.length; i++) if(s1[i] !== s2[i]) d++;
    return d;
}

/**
 * Envoie le fichier image au script Python pour extraction adaptative des formes
 */
function extraireSignatureViaPython(imageBuffer) {
    return new Promise((resolve, reject) => {
        const tempFilePath = path.join(__dirname, `temp_verification_${Date.now()}.png`);
        
        fs.writeFile(tempFilePath, imageBuffer, (err) => {
            if (err) return reject(new Error("Échec de création du fichier d'analyse temporaire."));

            // Exécution du script Python d'IA OpenCV
            exec(`python analyser_sceau.py "${tempFilePath}"`, (pyErr, stdout, stderr) => {
                // Nettoyage sécurisé du stockage local
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

                if (pyErr) {
                    console.error("Erreur Moteur Python :", stderr);
                    return reject(new Error("Le traitement de l'image par le moteur IA a échoué."));
                }

                try {
                    const formatJson = JSON.parse(stdout);
                    if (!formatJson.success) {
                        return reject(new Error(formatJson.message));
                    }
                    resolve(formatJson);
                } catch (parseErr) {
                    reject(new Error("Impossible de décoder les données de l'IA Python."));
                }
            });
        });
    });
}


/* ==========================================
   5. VERIFICATION (Endpoint principal APK)
========================================== */
app.post('/api/produit/verifier', verifLimiter, upload.single('sceau'), async (req, res) => {
    console.log("Tentative de vérification reçue - Envoi au décodeur de formes Python...");

    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Aucune image de sceau fournie." });
        }

        // Utilisation de la brique d'IA Python à la place de l'ancienne méthode sharp géométrique
        const signatureExtraite = await extraireSignatureViaPython(req.file.buffer);
        console.log("Segments binaires reconstruits par l'IA Python :", signatureExtraite);

        const { data: produits, error } = await supabase.from('sya_produit_certifie').select('*');

        if (error || !produits) {
            return res.status(500).json({ success: false, message: "Erreur de base de données." });
        }

        let meilleurMatch = null;
        let scoreMax = 0;

        produits.forEach(p => {
            // PROTECTION : Ignore les lignes de tests antérieures qui ont des colonnes vides (null)
            if (!p.segment_noyau || !p.segment_transition || !p.segment_peripherie) {
                return; 
            }

            const dN = getHammingDistance(signatureExtraite.noyau, p.segment_noyau);
            const dT = getHammingDistance(signatureExtraite.transition, p.segment_transition);
            const dP = getHammingDistance(signatureExtraite.peripherie, p.segment_peripherie);
            
            const totalErreurs = dN + dT + dP;
            const totalBits = 90; 
            const score = ((totalBits - totalErreurs) / totalBits) * 100;

            if (score > scoreMax) {
                scoreMax = score;
                meilleurMatch = p;
            }
        });

        // Seuil de confiance fixé à 85% pour tolérer les dommages physiques sur les étiquettes
        if (meilleurMatch && scoreMax >= 85) {
            return res.json({
                success: true,
                produit: meilleurMatch,
                timestamp_verification: new Date(),
                confidence: scoreMax.toFixed(2) + "%"
            });
        } else {
            console.log(`Échec de correspondance. Meilleur score trouvé : ${scoreMax.toFixed(2)}%`);
            return res.status(404).json({ 
                success: false, 
                message: "Vérification impossible. Sceau inconnu, altéré ou non certifié ANOR." 
            });
        }

    } catch (err) {
        console.error("Erreur interne Vérification:", err);
        return res.status(500).json({ 
            success: false, 
            message: err.message || "Une erreur interne est survenue lors de l'analyse du sceau." 
        });
    }
});


/* ==========================================
   6. DÉMARRAGE DU SERVEUR
========================================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("-------------------------------------------------");
    console.log(`[OK] ANOR Server (SYA) binaire démarré sur le port ${PORT}`);
    console.log("-------------------------------------------------");
});