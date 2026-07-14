/**
 * ==========================================================
 * server.js (ANOR V12 - MOTEUR LIGHTWEIGHT)
 * Architecture indexée : Délégation totale aux Services unifiés
 * ==========================================================
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const Services = require("./services");
const forgeService = require("./services/forgeService");

const app = express();
const PORT = process.env.PORT || 10000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const { pipeline, indexManager } = Services(supabase);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ storage: multer.memoryStorage() });

/* ==========================================================
   ROUTE API FORGE
========================================================== */

app.post("/api/forge", upload.fields([
    { name: "visuel", maxCount: 1 },
    { name: "certificat_pdf", maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            nom_produit,
            nom_producteur,
            lot,
            pays_origine
        } = req.body;

        if (
            !nom_produit ||
            !nom_producteur ||
            !lot ||
            !pays_origine
        ) {
            return res.status(400).json({
                success: false,
                message: "Paramètres obligatoires manquants."
            });
        }

        const {
            insertion,
            nonce
        } = forgeService.creer(req.body);

        const {
            error
        } = await supabase
            .from("sya_produit_certifie")
            .insert(insertion);

        if (error)
            throw error;

        indexManager.ajouter(insertion);

        res.json({
            success: true,
            identifiant: nonce,
            reference: insertion.index_geometrique
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

/* ==========================================================
   ROUTE API PRODUIT VERIFIER
========================================================== */

app.post("/api/produit/verifier", upload.single("sceau"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image absente"
            });
        }

        const resultat = await pipeline.executer(req.file.buffer);

        res.json(resultat);
    } catch (e) {
        console.error(e);
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
});

(async () => {
    await indexManager.charger();
    app.listen(PORT, () => {
        console.log("ANOR prêt.");
    });
})();