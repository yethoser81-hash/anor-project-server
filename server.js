/**
 * ==========================================================
 * server.js - ANOR V7 | PRODUCTION READY
 * ==========================================================
 */

require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ==========================================
   1. ROUTAGE DÉFAUT
========================================== */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard", "index.html"));
});

/* ==========================================
   2. FORGE : ENREGISTREMENT & STORAGE
========================================== */
app.post('/api/produit/enregistrer', upload.single('visuel'), async (req, res) => {
    try {
        const { nom_produit, lot, pays_origine } = req.body;
        let publicUrl = null;

        // Upload image vers Supabase Storage
        if (req.file) {
            const fileName = `produits/${Date.now()}_${req.file.originalname}`;
            const { error: uploadError } = await supabase.storage
                .from('produits')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

            if (uploadError) throw uploadError;
            publicUrl = supabase.storage.from('produits').getPublicUrl(fileName).data.publicUrl;
        }

        // Insertion base
        const { data, error } = await supabase.from("sya_produit_certifie").insert([{
            nom_produit, lot,
            code_sceau: `${nom_produit}_${lot}`,
            visuel_url: publicUrl,
            version_sceau: "7.0"
        }]).select().single();

        if (error) throw error;
        res.json({ success: true, id: data.id, visuel_url: publicUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ==========================================
   3. VÉRIFICATION IA (Moteur de comparaison)
========================================== */
app.post('/api/produit/verifier', upload.single('sceau'), async (req, res) => {
    try {
        if (!req.file) throw new Error("Aucune image de sceau reçue");
        
        // Exécution IA Python (via helper temporaire)
        const glyphesDetectes = await extraireGlyphesViaPython(req.file.buffer);
        
        const { data: produits } = await supabase.from('sya_produit_certifie').select('*');
        
        const match = produits.find(p => {
            try {
                const stored = JSON.parse(p.bibliotheque_formes || "[]");
                return JSON.stringify(stored) === JSON.stringify(glyphesDetectes);
            } catch (e) { return false; }
        });

        if (!match) return res.status(404).json({ success: false, message: "Sceau contrefait." });
        res.json({ success: true, produit: match });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ==========================================
   HELPER PYTHON
========================================== */
function extraireGlyphesViaPython(imageBuffer) {
    return new Promise((resolve, reject) => {
        const tempPath = `/tmp/scan_${Date.now()}.png`;
        fs.writeFileSync(tempPath, imageBuffer);
        
        exec(`python3 analyser_sceau.py "${tempPath}"`, (err, stdout) => {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            if (err) reject(err);
            else resolve(JSON.parse(stdout));
        });
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[OK] ANOR V7 déployé sur port ${PORT}`));