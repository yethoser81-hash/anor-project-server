/**
 * ============================================================
 * server.js
 * ANOR V3 - Moteur de conformité (Livraison finale)
 * ============================================================
 */

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
const { v4: uuidv4 } = require("uuid");
const archiver = require("archiver");
const { createCanvas } = require("canvas");

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

/* ==========================================
   UPLOAD SUPABASE STORAGE
========================================== */

async function uploaderVisuelProduit(fichier, lot) {

    if (!fichier) {
        return null;
    }

    const extension = path.extname(fichier.originalname);

    const nomFichier =
        `${lot}_${uuidv4()}${extension}`;

    const { error } = await supabase.storage
        .from("produits")
        .upload(
            nomFichier,
            fichier.buffer,
            {
                contentType: fichier.mimetype,
                upsert: false
            }
        );

    if (error) {
        throw error;
    }

    const { data } = supabase.storage
        .from("produits")
        .getPublicUrl(nomFichier);

    return data.publicUrl;

}

async function uploaderCertificat(fichier, lot){

    if(!fichier){
        return null;
    }

    const extension=
        path.extname(fichier.originalname);

    const nom=
        `${lot}_${uuidv4()}${extension}`;

    const {error}=await supabase.storage
        .from("certificats")
        .upload(
            nom,
            fichier.buffer,
            {
                contentType:fichier.mimetype
            }
        );

    if(error){
        throw error;
    }

    const {data}=supabase.storage
        .from("certificats")
        .getPublicUrl(nom);

    return data.publicUrl;

}

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
        version: "3.0.0",
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

        const salt = nonce;
        if (!salt) {
            return res.status(400).json({ success: false, message: "Nonce manquant" });
        }

        if (!nom_produit || !nom_producteur || !lot || !pays_origine) {
            return res.status(400).json({ success: false, message: "Champs requis manquants." });
        }

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

        let certificatURL=null;

        if(req.files.certificat_pdf){

            certificatURL=
                await uploaderCertificat(
                    req.files.certificat_pdf[0],
                    lot
                );

        }

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

        const bibliotheque = enrichirBibliotheque(signatureBinaire);
        if(!bibliotheque){
            throw new Error("Bibliothèque IA invalide.");
        }

        const sealId = crypto.createHash("sha256").update(signatureBinaire).digest("hex");
        
        /* ============================================================
            Upload du visuel produit
        ============================================================ */
        let visuelUrl = null;

        if(req.files?.visuel?.[0]){

            visuelUrl = await uploaderVisuelProduit(
                req.files.visuel[0],
                lot
            );
        
        }

        const cleanDate = (d) => (d && d.trim() !== "" ? d : null);

        const produitData = {
            nom_produit,
            nom_producteur,
            lot,
            nonce: salt,
            sceau_id: sealId,
            pays_origine,
            visuel_url: visuelUrl,
            certificat_url:certificatURL,
            type_emballage: type_emballage || "Non spécifié",
            composition: composition || "Non spécifié",
            date_fabrication: cleanDate(date_fabrication),
            date_peremption: cleanDate(date_peremption),
            date_certificat_conformite: cleanDate(date_certificat_conformite),
            code_sceau: signatureBinaire,
            segment_noyau: signatureBinaire.substring(0, 20),
            segment_transition: signatureBinaire.substring(20, 50),
            segment_peripherie: signatureBinaire.substring(50, 90),
            bibliotheque_formes: bibliotheque,
            version_sceau: "3.0"
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

// [Fonctions IA V2 précédemment ajoutées conservées ici]
function scoreGlyphes(glyphesIA, glyphesDB){
    if(!glyphesIA || !glyphesDB){ return null; }
    let total=0;
    let bons=0;
    ["noyau","transition","peripherie"].forEach(zone=>{
        if(!glyphesIA[zone] || !glyphesDB[zone]){ return; }
        const ia=glyphesIA[zone].formes;
        const db=glyphesDB[zone].formes;
        const longueur=Math.min(ia.length, db.length);
        for(let i=0; i<longueur; i++){
            total++;
            if(ia[i].forme===db[i].forme){ bons++; }
        }
    });
    if(total===0){ return null; }
    return (bons/total)*100;
}

function scoreOrientation(glyphesIA,glyphesDB){
    if(!glyphesIA || !glyphesDB){ return null; }
    let total=0;
    let score=0;
    ["noyau","transition","peripherie"].forEach(zone=>{
        if(!glyphesIA[zone] || !glyphesDB[zone]){ return; }
        const ia=glyphesIA[zone].formes;
        const db=glyphesDB[zone].formes;
        const longueur=Math.min(ia.length, db.length);
        for(let i=0; i<longueur; i++){
            total++;
            const o1= ia[i].rotation||0;
            const o2= db[i].rotation||0;
            const diff= Math.abs(o1-o2);
            score+= Math.max(0, 1-diff/180);
        }
    });
    if(total===0){ return null; }
    return(score/total)*100;
}

function scoreCluster(glyphesIA,glyphesDB){
    if(!glyphesIA || !glyphesDB){ return null; }
    let total=0;
    let bons=0;
    ["noyau","transition","peripherie"].forEach(zone=>{
        if(!glyphesIA[zone] || !glyphesDB[zone]){ return; }
        const ia= glyphesIA[zone].formes;
        const db= glyphesDB[zone].formes;
        const longueur=Math.min(ia.length, db.length);
        for(let i=0; i<longueur; i++){
            total++;
            if((ia[i].cluster||0) === (db[i].cluster||0)){ bons++; }
        }
    });
    if(total===0){ return null; }
    return(bons/total)*100;
}

function calculerScoreGlobal({ bits, glyphes, orientation, cluster }){
    let score=bits;
    if(glyphes!==null && orientation!==null && cluster!==null){
        score= bits*0.60 + glyphes*0.20 + orientation*0.10 + cluster*0.10;
    }
    return Number(score.toFixed(2));
}

function lireBibliotheque(produit){
    try{
        if(!produit || !produit.bibliotheque_formes){ return null; }
        return JSON.parse(produit.bibliotheque_formes);
    }
    catch{ return null; }
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

function genererSceauHD(bibliotheque) {
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext("2d");

    // fond
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1000, 1000);

    // cercle principal
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(500, 500, 420, 0, Math.PI * 2);
    ctx.stroke();

    function drawZone(zone, radius, color) {
        if (!bibliotheque || !bibliotheque[zone]) return;

        const formes = bibliotheque[zone].formes || [];
        const step = (Math.PI * 2) / formes.length;

        formes.forEach((f, i) => {
            const angle = i * step;

            const x = 500 + Math.cos(angle) * radius;
            const y = 500 + Math.sin(angle) * radius;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((f.rotation || 0) * Math.PI / 180);

            ctx.fillStyle = color;

            switch (f.forme) {
                case "cercle":
                    ctx.beginPath();
                    ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case "carre":
                    ctx.fillRect(-10, -10, 20, 20);
                    break;

                case "triangle":
                    ctx.beginPath();
                    ctx.moveTo(0, -10);
                    ctx.lineTo(10, 10);
                    ctx.lineTo(-10, 10);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }

            ctx.restore();
        });
    }

    drawZone("noyau", 120, "#000");
    drawZone("transition", 220, "#1e3799");
    drawZone("peripherie", 320, "#ce1126");

    return canvas.toBuffer("image/png");
}


/* ==========================================
   5. VERIFICATION (Endpoint principal APK)
========================================== */
app.post('/api/produit/verifier', verifLimiter, upload.single('sceau'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Aucune image." });

        const signatureExtraite = await extraireSignatureViaPython(req.file.buffer);

        const {
            noyau,
            transition,
            peripherie,
            glyphes = []
        } = signatureExtraite;

        if(noyau.length !== 20 || transition.length !== 30 || peripherie.length !== 40){
            return res.status(400).json({ success: false, message: "Lecture du sceau invalide." });
        }

        const { data: produits, error } = await supabase.from('sya_produit_certifie').select('*');
        if (error) throw error;

        let meilleurMatch = null;
        let scoreFinalMax = 0;
        let meilleurScoreBits = 0;
        let meilleurScoreGraphique = 0;

        for(const produit of produits){
            let scoreBits = 0;
            let scoreGraphique = 0;

            // 1 - COMPARAISON BITS
            const dN = getHammingDistance(noyau, produit.segment_noyau);
            const dT = getHammingDistance(transition, produit.segment_transition);
            const dP = getHammingDistance(peripherie, produit.segment_peripherie);
            const erreurs = dN + dT + dP;
            scoreBits = ((90 - erreurs) / 90) * 100;

            // 2 - COMPARAISON GLYPHES
            try{
                const bibliothequeDB = typeof produit.bibliotheque_formes === 'string' 
                    ? JSON.parse(produit.bibliotheque_formes) 
                    : produit.bibliotheque_formes;
                const bibliothequeIA = signatureExtraite.glyphes;
                let total=0;
                let ok=0;

                ["noyau","transition","peripherie"].forEach(zone=>{
                    const a = bibliothequeDB[zone] || [];
                    const b = bibliothequeIA[zone] || [];
                    const limite = Math.min(a.length, b.length);
                    for(let i=0; i<limite; i++){
                        total++;
                        if(a[i].glyphe === b[i].glyphe){ ok++; }
                    }
                });
                if(total){ scoreGraphique = (ok/total) * 100; }
            } catch(e){ scoreGraphique = 0; }

            // SCORE GLOBAL
            const scoreFinal = (scoreBits * 0.70) + (scoreGraphique * 0.30);

            if(scoreFinal > scoreFinalMax){
                scoreFinalMax = scoreFinal;
                meilleurMatch = produit;
                meilleurScoreBits = scoreBits;
                meilleurScoreGraphique = scoreGraphique;
            }
        }

        if (meilleurMatch && scoreFinalMax >= 95) {

            return res.json({

                success: true,

                confidence: Number(scoreFinalMax.toFixed(2)),

                score_bits: Number(meilleurScoreBits.toFixed(2)),

                score_graphique: Number(meilleurScoreGraphique.toFixed(2)),

                verification: new Date().toISOString(),

                verification_id: uuidv4(),

                kit_url: `${req.protocol}://${req.get("host")}/api/produit/kit/${meilleurMatch.id}`,

                produit: {

                    id: meilleurMatch.id,

                    sceau_id: meilleurMatch.sceau_id,

                    nom_produit: meilleurMatch.nom_produit,

                    nom_producteur: meilleurMatch.nom_producteur,

                    lot: meilleurMatch.lot,

                    numero_serie: meilleurMatch.numero_serie,

                    quantite_lot: meilleurMatch.quantite_lot,

                    pays_origine: meilleurMatch.pays_origine,

                    composition: meilleurMatch.composition,

                    type_emballage: meilleurMatch.type_emballage,

                    date_fabrication: meilleurMatch.date_fabrication,

                    date_peremption: meilleurMatch.date_peremption,

                    date_certificat_conformite:
                        meilleurMatch.date_certificat_conformite,

                    visuel_url: meilleurMatch.visuel_url,
                    
                    certificat_url: meilleurMatch.certificat_url,

                    version_sceau: meilleurMatch.version_sceau
                }

            });

        } else {
            return res.status(404).json({ success: false, message: "Sceau non conforme ou inconnu." });
        }

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});


/* ===========================================================
   6. GENERATION DU KIT OFFICIEL
=========================================================== */

app.get("/api/produit/kit/:id", async (req, res) => {

    try {

        const id = req.params.id;

        const { data: produit, error } = await supabase
            .from("sya_produit_certifie")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !produit) {
            return res.status(404).json({
                success: false,
                message: "Produit introuvable."
            });
        }

        const bibliotheque = typeof produit.bibliotheque_formes === "string"
            ? JSON.parse(produit.bibliotheque_formes)
            : produit.bibliotheque_formes;

        const sceauHD = genererSceauHD(bibliotheque);

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename=KIT_${produit.lot}.zip`);

        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.pipe(res);

        // =========================
        // 1. SCEAU HD
        // =========================
        archive.append(sceauHD, {
            name: "sceau_HD.png"
        });

        // =========================
        // 2. NOTICE OFFICIELLE
        // =========================
        archive.append(`
ANOR - NOTICE OFFICIELLE

Produit : ${produit.nom_produit}
Lot : ${produit.lot}

- Impression HD obligatoire
- Interdiction de modification
- Validité numérique certifiée ANOR V3

Ce document est généré automatiquement.
        `, {
            name: "notice.pdf.txt"
        });

        // =========================
        // 3. DOCUMENT JURIDIQUE
        // =========================
        archive.append(`
AVERTISSEMENT JURIDIQUE ANOR

Toute falsification du sceau ANOR V3 est passible de sanctions.

Produit certifié :
${produit.nom_produit}
${produit.nom_producteur}

Document officiel de conformité.
        `, {
            name: "legal.pdf.txt"
        });

        // =========================
        // 4. FICHE PRODUIT
        // =========================
        archive.append(JSON.stringify(produit, null, 4), {
            name: "fiche_produit.json"
        });

        // =========================
        // 5. VISUEL OFFICIEL
        // =========================
        if (produit.visuel_url) {
            archive.append(produit.visuel_url, {
                name: "visuel.txt"
            });
        }

        archive.finalize();

    } catch (e) {
        return res.status(500).json({
            success: false,
            message: e.message
        });
    }
});


/* ==========================================
   7. DÉMARRAGE DU SERVEUR
========================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[OK] ANOR Server démarré sur port ${PORT}`);
});