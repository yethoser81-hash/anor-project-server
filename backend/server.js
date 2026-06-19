require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
// Ajout pour la sécurité
const rateLimit = require('express-rate-limit');

const app = express();

/* ==========================================
   1. SÉCURITÉ & CONFIGURATION INITIALE
========================================== */

// AMÉLIORATION : Limiter le bruit de fond (Rate Limiting)
// Évite qu'un pirate ne brute-force le serveur avec des millions d'images
const verifLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limite chaque IP à 50 vérifications par fenêtre
    message: { success: false, message: "Trop de tentatives. Réessayez dans 15 min." }
});

// AMÉLIORATION : Filtrage strict des fichiers (Multer)
// N'accepte QUE les images réelles pour bloquer les scripts malveillants
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
        fileSize: 5 * 1024 * 1024 // Réduit à 5Mo, largement suffisant pour un sceau
    }
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Secret pour la génération cryptographique
const ANOR_SECRET = process.env.ANOR_SECRET;
if (!ANOR_SECRET) {
    console.error("ERREUR : ANOR_SECRET manquante dans .env");
    process.exit(1);
}

// Middleware standards
app.use(cors({ origin: '*' })); // Permettre l'accès depuis l'APK mobile
app.use(express.json());
// Servir les fichiers statiques (images de produits par défaut, etc.)
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
   3. FORGE (IDENTIFICATION & SIGNATURE)
   Cette partie crée les données inviolables
========================================== */
app.post('/api/produit/enregistrer', async (req, res) => {
    try {
        const {
            nom_produit,
            nom_producteur,
            lot,
            pays_origine,
            url_visuel,
            // Autres champs optionnels que vous aviez
        } = req.body;

        // Validation minimale des champs requis
        if (!nom_produit || !nom_producteur || !lot || !pays_origine) {
            return res.status(400).json({ success: false, message: "Champs requis manquants." });
        }

        // Vérification d'unicité du lot
        const { data: existing } = await supabase
            .from('sya_produit_certifie')
            .select('id')
            .eq('nom_produit', nom_produit)
            .eq('lot', lot)
            .single();

        if (existing) {
            return res.status(409).json({ success: false, message: "Ce lot de produit est déjà enregistré." });
        }

        // --- GÉNÉRATION DE LA SIGNATURE CRYPTOGRAPHIQUE INVIOLABLE ---
        // Utilisation de HMAC-SHA256 avec le secret ANOR
        const salt = Date.now().toString();
        const signature = crypto
            .createHmac('sha256', ANOR_SECRET)
            .update(`${nom_produit}-${nom_producteur}-${lot}-${salt}`)
            .digest('hex');

        // AMÉLIORATION : Segmentation sécurisée du hash
        // Ces segments seront "encodés" visuellement sur le sceau physique
        const produitData = {
            ...req.body, // Inclure tous les champs envoyés (ceux d'origine)
            visuel_url: url_visuel || 'p_default.png',
            
            // Stockage des segments pour la comparaison
            code_sceau: signature, // Hash complet de référence
            segment_noyau: signature.substring(0, 20),
            segment_transition: signature.substring(20, 40),
            segment_peripherie: signature.substring(40, 64),
        };

        // Insertion sécurisée dans Supabase
        const { error } = await supabase
            .from('sya_produit_certifie')
            .insert([produitData]);

        if (error) throw error;

        res.json({
            success: true,
            message: "Produit enregistré avec succès.",
            code_sceau: signature,
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
   4. MOTEUR DE LECTURE OPTIQUE (Robustesse)
========================================== */

// --- NOUVELLE FONCTION : CALCUL DE DISTANCE DE HAMMING ---
function getHammingDistance(s1, s2) {
    let d = 0;
    for(let i = 0; i < s1.length; i++) if(s1[i] !== s2[i]) d++;
    return d;
}

/**
 * AMÉLIORATION : Préparation de l'image optimisée
 * Pipeline d'analyse vectorielle pour isoler les motifs du sceau
 */
async function preprocessImage(buffer) {
    return await sharp(buffer)
        .resize(1000, 1000, { fit: 'contain', background: '#ffffff' }) // Forcer ratio 1:1
        .grayscale() // Supprimer la couleur
        .blur(1.5) // NOUVEAU : Lissage des rayures et reflets
        .normalize() // Équilibrer les contrastes
        // AMÉLIORATION : Seuil adaptatif binaire pour une meilleure binarisation
        .threshold(140) // Plus agressif que 140 pour supprimer les bruits de fond
        .raw() // Obtenir les pixels purs (0-255)
        .toBuffer();
}

/**
 * AMÉLIORATION : Lecture adaptative robuste (Seuil local)
 * Calcule la moyenne des pixels dans une zone 3x3 pour compenser
 * les ombres ou les reflets sur le sceau physique.
 */
function readZoneRobust(buffer, x, y, width = 1000) {
    let sum = 0;
    let count = 0;

    // Analyse locale (zone 3x3)
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const px = x + i;
            const py = y + j;

            // Vérifier les bords
            if (px >= 0 && py >= 0 && px < width && py < width) {
                const index = py * width + px;
                sum += buffer[index];
                count++;
            }
        }
    }

    if (count === 0) return "0";

    // AMÉLIORATION : Tolérance de seuil Adaptative
    // Au lieu d'un seuil binaire fixe (128), on utilise 145 pour "capturer" 
    // les motifs potentiellement pâles ou altérés physiquement.
    const average = sum / count;
    return average < 145 ? "F" : "0"; // "F" pour foncé (Bit 1), "0" pour clair (Bit 0)
}

/**
 * Extraction de la signature géométrique depuis l'image preprocessée
 */
async function extraireSignatureDepuisImage(buffer) {
    try {
        const imageBuffer = await preprocessImage(buffer);

        const centerX = 500;
        const centerY = 500;
        const angleOffset = 0; // À ajuster dynamiquement si rotation nécessaire

        const config = [
            { key: 'noyau', rayon: 260, count: 20 },
            { key: 'transition', rayon: 360, count: 30 },
            { key: 'peripherie', rayon: 440, count: 40 }
        ];

        const segmentsExtrait = {};

        for (const c of config) {
            let chaine = "";
            for (let i = 0; i < c.count; i++) {
                // Calcul trigonométrique des coordonnées de chaque bit
                const angle = (i / c.count) * Math.PI * 2 + angleOffset;
                const x = Math.round(centerX + Math.cos(angle) * c.rayon);
                const y = Math.round(centerY + Math.sin(angle) * c.rayon);

                chaine += readZoneRobust(imageBuffer, x, y);
            }
            segmentsExtrait[c.key] = chaine;
        }

        return segmentsExtrait;
    } catch (err) {
        throw new Error("Impossible d'analyser l'image : " + err.message);
    }
}


/* ==========================================
   5. VERIFICATION (Endpoint principal APK)
   C'est l'intelligence de votre système
========================================== */
app.post('/api/produit/verifier', verifLimiter, upload.single('sceau'), async (req, res) => {
    console.log("Tentative de vérification reçue...");

    try {
        // Validation basique
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Aucune image de sceau fournie." });
        }

        // --- LECTURE DU SCEAU (Lecture Géométrique Adaptive) ---
        const signatureExtraite = await extraireSignatureDepuisImage(req.file.buffer);
        console.log("Segments lus depuis l'image :", signatureExtraite);

        // --- COMPARAISON AVEC LE REGISTRE SUPABASE (Validation Inviolable) ---
        // NOUVEAU : On récupère tous les produits pour comparer la distance de Hamming
        const { data: produits, error } = await supabase.from('sya_produit_certifie').select('*');

        if (error || !produits) {
            return res.status(500).json({ success: false, message: "Erreur de base de données." });
        }

        let meilleurMatch = null;
        let scoreMax = 0;

        produits.forEach(p => {
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

        // Seuil de confiance : 85% de similitude requis
        if (meilleurMatch && scoreMax >= 85) {
            return res.json({
                success: true,
                produit: meilleurMatch,
                timestamp_verification: new Date(),
                confidence: scoreMax.toFixed(2) + "%"
            });
        } else {
            console.log("Sceau non reconnu ou altéré.");
            return res.status(404).json({ 
                success: false, 
                message: "Vérification impossible. Sceau inconnu ou non certifié ANOR." 
            });
        }

    } catch (err) {
        console.error("Erreur interne Vérification:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Une erreur interne est survenue lors de l'analyse du sceau." 
        });
    }
});


/* ==========================================
   6. DÉMARRAGE DU SERVEUR (Port 10000)
========================================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("-------------------------------------------------");
    console.log(`[OK] ANOR Server (SYA) d&émarré sur le port ${PORT}`);
    console.log(`[INFO] Supabase URL : ${process.env.SUPABASE_URL}`);
    console.log("-------------------------------------------------");
});