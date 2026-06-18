require('dotenv').config(); // Ajout obligatoire en haut pour charger les variables
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Configuration - Récupération sécurisée via process.env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ANOR_SECRET = process.env.ANOR_SECRET;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * MOTEUR DE VISION : Extraction de signature avec ancrage sur le logo
 */
async function extraireSignatureDepuisImage(buffer) {
    // 1. Normalisation de base
    const image = sharp(buffer).resize(1000, 1000).grayscale();
    
    // 2. Détection du centre via le logo (Ancrage)
    // Note : Cette fonction simule la détection du centre réel et de l'angle
    // Si l'utilisateur scanne de biais, les variables centerX, centerY et angle s'ajustent
    const { centerX, centerY, angle } = await detecterLogoAnor(image);

    const imageBinaire = await image.threshold(128).raw().toBuffer();
    const segments = { noyau: "", transition: "", peripherie: "" };
    
    const config = [
        { key: 'noyau', rayon: 280, count: 20 },
        { key: 'transition', rayon: 360, count: 30 },
        { key: 'peripherie', rayon: 440, count: 40 }
    ];

    config.forEach(c => {
        let chaine = "";
        for (let i = 0; i < c.count; i++) {
            // Calcul ajusté par l'angle détecté et le centre réel
            const angleGlobal = (i / c.count) * Math.PI * 2 + angle;
            const x = Math.round(centerX + Math.cos(angleGlobal) * c.rayon);
            const y = Math.round(centerY + Math.sin(angleGlobal) * c.rayon);
            
            const index = y * 1000 + x;
            chaine += (imageBinaire[index] < 128) ? "F" : "0"; 
        }
        segments[c.key] = chaine;
    });
    return segments;
}

// Fonction de recalage automatique sur le logo
async function detecterLogoAnor(image) {
    // Dans une implémentation réelle, ici on utilise du Template Matching (OpenCV)
    // Pour l'instant, nous calibrons sur le centre théorique
    return { centerX: 500, centerY: 500, angle: 0 };
}

// --- ROUTE DE FORGE (Enregistrement) ---
app.post('/api/produit/enregistrer', async (req, res) => {
    try {
        const { nom_produit, nom_producteur, lot, type_emballage, caracteristique_produit, pays_origine, date_certificat_conformite, date_fabrication, date_peremption, url_visuel } = req.body;

        const { data: existing } = await supabase.from('sya_produit_certifie').select('id').eq('nom_produit', nom_produit).eq('lot', lot).single();
        if (existing) return res.status(409).json({ success: false, message: "Ce lot a déjà été certifié." });

        const signature = crypto.createHmac('sha256', ANOR_SECRET).update(`${nom_produit}-${lot}-${Date.now()}`).digest('hex');
        
        const produitData = {
            nom_produit, nom_producteur, lot, type_emballage, caracteristique_produit, pays_origine, visuel_url: url_visuel,
            code_sceau: signature,
            segment_noyau: signature.substring(0, 20),
            segment_transition: signature.substring(20, 40),
            segment_peripherie: signature.substring(40, 64),
            date_certificat_conformite: pays_origine.toLowerCase() === 'cameroun' ? date_certificat_conformite : null,
            date_fabrication: pays_origine.toLowerCase() !== 'cameroun' ? date_fabrication : null,
            date_peremption: pays_origine.toLowerCase() !== 'cameroun' ? date_peremption : null
        };

        const { error } = await supabase.from('sya_produit_certifie').insert([produitData]);
        if (error) throw error;

        res.json({ success: true, code_sceau: signature, structure_sceau: { noyau: produitData.segment_noyau, transition: produitData.segment_transition, peripherie: produitData.segment_peripherie } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- ROUTE DE VÉRIFICATION (Vérification APK) ---
app.post('/api/produit/verifier', upload.single('sceau'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Scan invalide." });

        const signature = await extraireSignatureDepuisImage(req.file.buffer);
        
        const { data, error } = await supabase
            .from('sya_produit_certifie')
            .select('nom_produit, nom_producteur, pays_origine, type_emballage, caracteristique_produit, visuel_url, date_certificat_conformite, date_fabrication, date_peremption')
            .eq('segment_noyau', signature.noyau)
            .eq('segment_transition', signature.transition)
            .eq('segment_peripherie', signature.peripherie)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: "Produit non certifié ou sceau falsifié." });

        res.json({ success: true, produit: data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur lors de l'authentification." });
    }
});

app.listen(10000, () => console.log('Forge et Vérification actives sur port 10000'));