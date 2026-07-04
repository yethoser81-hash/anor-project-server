/**
 * ==========================================================
 * server.js
 * ANOR V7 - Moteur d'orchestration stabilisé
 * ==========================================================
 */

require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const fs = require('fs');
const { createCanvas } = require("canvas");
const archiver = require("archiver");

// Modules ANOR V7
const decodeur = require('./decodeur_signature');
const Renderer = require('./forge/forgeRenderer');

const app = express();

/* ==========================================
   1. CONFIGURATION & SÉCURITÉ
========================================== */

const verifLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50, 
    message: { success: false, message: "Trop de tentatives." }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Format non autorisé'));
    }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const ANOR_SECRET = process.env.ANOR_SECRET;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ==========================================
   2. HELPERS (Orchestrateur)
========================================== */

function extraireGlyphesViaPython(imageBuffer) {
    return new Promise((resolve, reject) => {
        const tempFilePath = path.join(__dirname, `temp_${Date.now()}.png`);
        const scriptPython = path.join(__dirname, 'analyser_sceau.py');
        fs.writeFileSync(tempFilePath, imageBuffer);
        
        const cmd = process.platform === "win32" ? `python "${scriptPython}" "${tempFilePath}"` : `python3 "${scriptPython}" "${tempFilePath}"`;
        exec(cmd, (err, stdout) => {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            if (err) return reject(new Error("Erreur moteur IA"));
            try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error("Erreur décodage JSON")); }
        });
    });
}

/* ==========================================
   3. ROUTES
========================================== */

/* ==========================================================
   REGISTRY PREMIUM
========================================================== */

app.get('/api/registry/produits', async (req, res) => {

    try {

        const page = parseInt(req.query.page || 1);
        const limit = parseInt(req.query.limit || 20);

        const search = req.query.search || "";
        const producteur = req.query.producteur || "";
        const pays = req.query.pays || "";

        let query = supabase
            .from("sya_produit_certifie")
            .select("*", { count: "exact" });

        if (search !== "") {

            query = query.or(
                `nom_produit.ilike.%${search}%,nom_producteur.ilike.%${search}%,lot.ilike.%${search}%`
            );

        }

        if (producteur !== "") {

            query = query.eq("nom_producteur", producteur);

        }

        if (pays !== "") {

            query = query.eq("pays_origine", pays);

        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
            .order("created_at", { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({

            success: true,

            total: count,

            page,

            limit,

            produits: data

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

/* ==========================================================
   PRODUCT AUDIT
========================================================== */

app.get("/api/product_audit/:id", async (req, res) => {

    try {

        const { data, error } = await supabase

            .from("sya_produit_certifie")

            .select("*")

            .eq("id", req.params.id)

            .single();

        if (error) throw error;

        res.json({

            success: true,

            produit: data

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

app.post('/api/produit/enregistrer', upload.fields([{ name: 'certificat_pdf' }, { name: 'visuel' }]), async (req, res) => {
    try {
        const { nom_produit, nom_producteur, lot, pays_origine, nonce } = req.body;
        
        const signature = decodeur.genererSignature(nom_produit, nom_producteur, lot, pays_origine, nonce, ANOR_SECRET);
        const bibliotheque = decodeur.bitsVersBibliotheque(signature);

        const segment_noyau = signature.substring(0,30);
const segment_transition = signature.substring(30,60);
const segment_peripherie = signature.substring(60);

const { error } = await supabase
.from("sya_produit_certifie")
.insert([{

    nom_produit,
    nom_producteur,
    lot,
    pays_origine,

    nonce,

    code_sceau: signature,

    segment_noyau,
    segment_transition,
    segment_peripherie,

    bibliotheque_formes: JSON.stringify(bibliotheque),

    version_sceau:"7.0"

}]);

        if (error) throw error;
        res.json({ success: true, code_sceau: signature });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/produit/verifier', verifLimiter, upload.single('sceau'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false });

        const glyphesDetectes = await extraireGlyphesViaPython(req.file.buffer);
        
        const { data: produits } = await supabase.from('sya_produit_certifie').select('*');
        const match = decodeur.comparerSceau(glyphesDetectes, produits);

        if (!match) return res.status(404).json({ success: false, message: "Sceau non conforme." });

        res.json({ success: true, produit: match });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/produit/kit/:id", async (req, res) => {
    const { data: produit } = await supabase.from("sya_produit_certifie").select("*").eq("id", req.params.id).single();
    const biblio = typeof produit.bibliotheque_formes === "string" ? JSON.parse(produit.bibliotheque_formes) : produit.bibliotheque_formes;
    
    const canvas = createCanvas(1000, 1000);
    const renderer = new Renderer(canvas);
    
    renderer.renderSceau(biblio); 

    const archive = archiver("zip");
    archive.pipe(res);
    archive.append(canvas.toBuffer("image/png"), { name: "sceau_HD.png" });
    archive.finalize();
});

app.get("/api/product_audit", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("sya_produit_certifie")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            produits: data
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[OK] ANOR V7 Server (Stabilisé) sur port ${PORT}`));