require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const fs = require('fs');
const enrichirBibliotheque = require('./ia_constructeur');

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
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non autorisé.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
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
app.post('/api/produit/enregistrer', upload.fields([
    { name: 'certificat_pdf' }, 
    { name: 'visuel' }
]), async (req, res) => {
    try {
        const {
            nom_produit, nom_producteur, lot, pays_origine,
            type_emballage, composition, date_fabrication,
            date_peremption, date_certificat_conformite, nonce
        } = req.body;

        // Point 3 : Utilisation du nonce
        const salt = nonce;
        if (!salt) {
            return res.status(400).json({ success: false, message: "Nonce manquant" });
        }

        if (!nom_produit || !nom_producteur || !lot || !pays_origine) {
            return res.status(400).json({ success: false, message: "Champs requis manquants." });
        }

        // Point 4 : Correction contrôle doublons
        const { data: existing } = await supabase
            .from('sya_produit_certifie')
            .select('id')
            .eq("nom_producteur", nom_producteur)
            .eq("nom_produit", nom_produit)
            .eq("lot", lot)
            .single();

        if (existing) {
            return res.status(409).json({ success: false, message: "Ce lot de produit est déjà enregistré." });
        }

        // Point 2 : Signature étendue
        const donneesSignature = [
            nom_produit, nom_producteur, lot, pays_origine,
            type_emballage || "", composition || "",
            date_fabrication || "", date_peremption || "",
            date_certificat_conformite || "", salt
        ].join("|");

        const hmacBuffer = crypto.createHmac("sha256", ANOR_SECRET).update(donneesSignature).digest();

        let signatureBinaire = "";
        for (const byte of hmacBuffer) {
            signatureBinaire += byte.toString(2).padStart(8, '0');
        }
        signatureBinaire = signatureBinaire.substring(0, 90);

        // Point 9 : Vérification bibliothèque
        const bibliotheque = enrichirBibliotheque(signatureBinaire);
        if(!bibliotheque){
            throw new Error("Bibliothèque IA invalide.");
        }

        // Point 11 : ID unique
        const sealId = crypto.createHash("sha256").update(signatureBinaire).digest("hex");

        const cleanDate = (d) => (d && d.trim() !== "" ? d : null);

        // Point 10 : Sauvegarde nonce + seal_id
        const produitData = {
            nom_produit,
            nom_producteur,
            lot,
            nonce: salt,
            sceau_id: sealId,
            pays_origine,
            visuel_url: 'p_default.png',
            type_emballage: type_emballage || "Non spécifié",
            composition: composition || "Non spécifié",
            date_fabrication: cleanDate(date_fabrication),
            date_peremption: cleanDate(date_peremption),
            date_certificat_conformite: cleanDate(date_certificat_conformite),
            code_sceau: signatureBinaire,
            segment_noyau: signatureBinaire.substring(0, 20),
            segment_transition: signatureBinaire.substring(20, 50),
            segment_peripherie: signatureBinaire.substring(50, 90),
            bibliotheque_formes: JSON.stringify(bibliotheque)
        };

        // Point 12 : Journalisation
        console.log("========== FORGE ==========");
        console.log("Produit :", nom_produit);
        console.log("Lot :", lot);
        console.log("Nonce :", salt);
        console.log("Signature :", signatureBinaire);
        console.log("===========================");

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
            },
            bibliotheque
        });

    } catch (err) {
        console.error("❌ ERREUR FORGE COMPLET :", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


/* ==========================================
   4. MOTEUR DE LECTURE OPTIQUE IA PYTHON
========================================== */

function getHammingDistance(s1, s2) {
    let d = 0;
    for(let i = 0; i < s1.length; i++) if(s1[i] !== s2[i]) d++;
    return d;
}

function extraireSignatureViaPython(imageBuffer) {
    return new Promise((resolve, reject) => {
        const tempFilePath = path.join(__dirname, `temp_verification_${Date.now()}.png`);
        const scriptPython = path.join(__dirname, 'analyser_sceau_v4.py');
        
        fs.writeFile(tempFilePath, imageBuffer, (err) => {
            if (err) return reject(new Error("Échec création fichier temp."));

            const cmd = process.platform === "win32"
                ? `python "${scriptPython}" "${tempFilePath}"`
                : `python3 "${scriptPython}" "${tempFilePath}"`;

            exec(cmd, (pyErr, stdout, stderr) => {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                if (pyErr) return reject(new Error("Erreur moteur IA."));

                try {
                    const formatJson = JSON.parse(stdout);
                    resolve(formatJson);
                } catch (parseErr) {
                    reject(new Error("Erreur décodage IA."));
                }
            });
        });
    });
}


/* ==========================================
   5. VERIFICATION (Endpoint principal APK)
========================================== */
app.post('/api/produit/verifier', verifLimiter, upload.single('sceau'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Aucune image." });

        const signatureExtraite = await extraireSignatureViaPython(req.file.buffer);

        // Point 8 : Longueur segments
        if(
            signatureExtraite.noyau.length !== 20 ||
            signatureExtraite.transition.length !== 30 ||
            signatureExtraite.peripherie.length !== 40
        ){
            return res.status(400).json({ success: false, message: "Lecture du sceau invalide." });
        }

        const { data: produits, error } = await supabase.from('sya_produit_certifie').select('*');
        if (error) throw error;

        let meilleurMatch = null;
        let scoreMax = 0;

        // Point 5, 6, 7 : Calcul score bits uniquement
        produits.forEach(p => {
            const dN = getHammingDistance(signatureExtraite.noyau, p.segment_noyau);
            const dT = getHammingDistance(signatureExtraite.transition, p.segment_transition);
            const dP = getHammingDistance(signatureExtraite.peripherie, p.segment_peripherie);
            
            const totalErreurs = dN + dT + dP;
            const scoreBits = ((90 - totalErreurs) / 90) * 100;

            if (scoreBits > scoreMax) {
                scoreMax = scoreBits;
                meilleurMatch = p;
            }
        });

        // Point 1 : Seuil 97%
        if (meilleurMatch && scoreMax >= 97) {
            return res.json({
                success: true,
                produit: meilleurMatch,
                confidence: scoreMax.toFixed(2) + "%"
            });
        } else {
            return res.status(404).json({ success: false, message: "Sceau non conforme ou inconnu." });
        }

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});


/* ==========================================
   6. DÉMARRAGE DU SERVEUR
========================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[OK] ANOR Server démarré sur port ${PORT}`);
});