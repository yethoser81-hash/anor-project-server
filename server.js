/**
 * ==========================================================
 * server.js (ANOR V11 - MOTEUR D'IDENTIFICATION GÉOMÉTRIQUE)
 * Synchronisé avec index.html et forge.js (Nouvelle Table)
 * ==========================================================
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const JSZip = require("jszip");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const { execFile } = require("child_process");
const util = require("util");
const os = require("os");

const exec = util.promisify(execFile);

const TEMP = path.join(os.tmpdir(), "anor_scan");
if (!fs.existsSync(TEMP)) {
    fs.mkdirSync(TEMP, { recursive: true });
}

const Compositeur = require("./public/forge/compositeur.js");
const { comparerSignature } = require("./helpers/comparateur");

const genererSceau = require("./helpers/genererSceau");
const genererGuidePDF = require("./helpers/genererGuidePDF");
const genererJuridiquePDF = require("./helpers/genererJuridiquePDF");
const genererPartenairesPDF = require("./helpers/genererPartenairesPDF");
const genererXLSX = require("./helpers/genererSerialisationXLSX");
const genererXML = require("./helpers/genererSerialisationXML");

const { getBibliotheque } = require("./ia_constructeur");

const app = express();
const PORT = process.env.PORT || 10000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith(".js")) {
            res.setHeader("Content-Type", "application/javascript");
        }
    }
}));

const upload = multer({ storage: multer.memoryStorage() });

function genererNumeroForge() {
    const d = new Date();
    return "ANOR-" + d.getFullYear() + 
           String(d.getMonth() + 1).padStart(2, "0") + 
           String(d.getDate()).padStart(2, "0") + "-" + 
           crypto.randomBytes(4).toString("hex").toUpperCase();
}

function genererSerialisation(quantite, lot) {
    const liste = [];
    for (let i = 1; i <= quantite; i++) {
        liste.push(`${lot}-${String(i).padStart(8, "0")}`);
    }
    return liste;
}

/* ==========================================================
   ROUTE API FORGE (SYNCHRONISÉE AVEC NOUVELLE TABLE)
========================================================== */

app.post("/api/forge", upload.fields([{ name: "visuel", maxCount: 1 }, { name: "certificat_pdf", maxCount: 1 }]), async (req, res) => {
    try {
        const { 
            nom_produit, 
            nom_producteur, 
            lot, 
            pays_origine, 
            composition, 
            type_emballage,
            date_certificat_conformite,
            date_fabrication,
            date_peremption,
            quantite
        } = req.body;
        
        const qte = parseInt(quantite || 1, 10);
        
        if (!nom_produit || !nom_producteur || !lot || !pays_origine) {
            return res.status(400).json({ success: false, message: "Paramètres obligatoires manquants." });
        }

        const signature = [nom_produit, nom_producteur, lot, pays_origine, qte].join("_");
        const nonce = genererNumeroForge();

        const instructions = Compositeur.composer(signature, { zoneSerie: true });
        const bibliothequeDonnees = getBibliotheque();

        const referenceGeometrique = instructions.map((g, index) => {
            return {
                forme: g.glyphe.forme,
                plein: g.glyphe.plein,
                anneau: g.anneau,
                position: g.position,
                angle: Number((g.angle * 180 / Math.PI).toFixed(2)),
                rayon: g.rayon
            };
        });

        referenceGeometrique.sort((a,b) => (a.anneau !== b.anneau) ? a.anneau - b.anneau : a.position - b.position);

        const empreinteGeometrique = crypto.createHash("sha256").update(JSON.stringify(referenceGeometrique)).digest("hex");

        let visuelURL = null;
        if (req.files?.visuel) {
            const f = req.files.visuel[0];
            const ext = path.extname(f.originalname);
            const nomPropre = f.originalname.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
            const pathS = `produits/${nonce}_${nomPropre}${ext}`;
            const uploadImage = await supabase.storage.from("produits").upload(pathS, f.buffer, { contentType: f.mimetype, upsert: false });
            if (uploadImage.error) throw new Error("UPLOAD IMAGE : " + uploadImage.error.message);
            visuelURL = supabase.storage.from("produits").getPublicUrl(pathS).data.publicUrl;
        }

        let certURL = null;
        if (req.files?.certificat_pdf) {
            const f = req.files.certificat_pdf[0];
            const pathS = `certificats/${nonce}.pdf`;
            const uploadCert = await supabase.storage.from("certificats").upload(pathS, f.buffer, { contentType: f.mimetype, upsert: false });
            if (uploadCert.error) throw new Error("UPLOAD CERTIFICAT : " + uploadCert.error.message);
            certURL = supabase.storage.from("certificats").getPublicUrl(pathS).data.publicUrl;
        }

        const insertion = { 
            nom_produit, nom_producteur, lot, pays_origine, quantite: qte, 
            composition, type_emballage, date_certificat_conformite, date_fabrication, date_peremption,
            signature_maitre: signature, bibliotheque_formes: referenceGeometrique, serialisation: genererSerialisation(qte, lot), 
            empreinte_geometrique: empreinteGeometrique, visuel_url: visuelURL, certificat_url: certURL, nonce: nonce 
        };

        const { error: insertError } = await supabase.from("sya_produit_certifie").insert(insertion);
        if (insertError) throw new Error("SUPABASE : " + insertError.message);

        res.json({ success: true, identifiant: nonce });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ==========================================================
   ROUTE API PRODUIT VERIFIER
========================================================== */

app.post("/api/produit/verifier", upload.single("sceau"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Aucune image reçue" });

        const imagePath = path.join(TEMP, `${Date.now()}.jpg`);
        fs.writeFileSync(imagePath, req.file.buffer);

        const vision = await exec("python", [path.join(__dirname, "vision_decoder.py"), imagePath]);
        const lecture = JSON.parse(vision.stdout);

        console.log("=========== SIGNATURE LUE ===========");
        console.log(JSON.stringify(lecture.signature, null, 2));
        console.log("=====================================");

        if (!lecture.success || !lecture.sceau_detecte) {
            return res.json({ success: false, message: lecture.message || "Sceau ANOR non détecté" });
        }

        const { data: produits, error } = await supabase.from("sya_produit_certifie").select("*");
        if (error) throw error;
        
        let meilleurScore = 0;
        let meilleurProduit = null;

        for (const p of produits) {
            const reference = typeof p.bibliotheque_formes === 'string' ? JSON.parse(p.bibliotheque_formes) : p.bibliotheque_formes;
            const refGlyphes = reference.glyphes || reference;
            
            console.log("=========== SIGNATURE BDD ===========");
            console.log(JSON.stringify(refGlyphes, null, 2));
            console.log("====================================");
            
            const score = comparerSignature(lecture.signature, refGlyphes);
            
            console.log("=================================");
            console.log("Produit :", p.nom_produit);
            console.log("Score :", score);
            console.log("Glyphes détectés :", lecture.signature.length);
            console.log("Glyphes référence :", refGlyphes.length);
            console.log("=================================");

            if (score > meilleurScore) {
                meilleurScore = score;
                meilleurProduit = p;
            }
        }

        if (meilleurScore < 95) {
            return res.json({ 
                success: false, 
                authentique: false,  
                message: "Authenticité non validée", 
                score: meilleurScore, 
                diagnostic: {
                    glyphesDetectes: lecture.signature.length,
                    glyphesReference: meilleurProduit ? (Array.isArray(meilleurProduit.bibliotheque_formes) ? meilleurProduit.bibliotheque_formes.length : JSON.parse(meilleurProduit.bibliotheque_formes).length) : 0,
                    produit: meilleurProduit ? meilleurProduit.nom_produit : null
                }
            });
        }

        res.json({
            success: true, 
            authentique: true, 
            score: meilleurScore, 
            diagnostic: { 
                glyphesDetectes: lecture.signature.length, 
                glyphesReference: Array.isArray(meilleurProduit.bibliotheque_formes) ? meilleurProduit.bibliotheque_formes.length : JSON.parse(meilleurProduit.bibliotheque_formes).length
            },
            produit: meilleurProduit
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ==========================================================
   ROUTE API EXPORT KIT
========================================================== */

app.post("/api/export/kit", async (req, res) => {
    try {
        const { signature, lot, quantite } = req.body;
        const qte = parseInt(quantite, 10);
        const nonce = "KIT_" + Date.now();
        const tempFolder = path.join(__dirname, "generated", nonce);
        fs.mkdirSync(tempFolder, { recursive: true });

        const serialisation = genererSerialisation(qte, lot);
        const instructions = Compositeur.composer(signature, { zoneSerie: true });

        fs.writeFileSync(path.join(tempFolder, "05_Serialisation.csv"), "NumeroSerie\n" + serialisation.join("\n"), "utf8");
        await genererXLSX(serialisation, path.join(tempFolder, "05_Serialisation.xlsx"));
        await genererXML(serialisation, path.join(tempFolder, "05_Serialisation.xml"));
        await genererGuidePDF(path.join(tempFolder, "03_Guide_Impression.pdf"));
        await genererJuridiquePDF(path.join(tempFolder, "04_Avertissement_Juridique.pdf"));
        await genererPartenairesPDF(path.join(tempFolder, "06_Partenaires_Impression.pdf"));

        const zip = new JSZip();                
        const files = fs.readdirSync(tempFolder);
        files.forEach(file => {
            zip.file(file, fs.readFileSync(path.join(tempFolder, file)));
        });

        const contenu = await zip.generateAsync({ type: "nodebuffer" });
        fs.rmSync(tempFolder, { recursive: true, force: true });

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename=KIT_ANOR_${lot}.zip`);
        res.send(contenu);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/registry", async (req, res) => {
    const { data, error } = await supabase.from("sya_produit_certifie").select("*");
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.listen(PORT, () => console.log(`ANOR V11 Forge opérationnelle sur le port ${PORT}`));