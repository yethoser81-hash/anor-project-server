/**
 * ==========================================================
 * server.js (ANOR V10 - SYNCHRONISÉ ET COMPLET)
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
const { createClient } = require("@supabase/supabase-js");

// Moteur de rendu partagé (Logique identique au frontend)
const Compositeur = require("./public/forge/compositeur.js");

// Helpers de génération
const genererSceau = require("./helpers/genererSceau");
const genererGuidePDF = require("./helpers/genererGuidePDF");
const genererJuridiquePDF = require("./helpers/genererJuridiquePDF");
const genererPartenairesPDF = require("./helpers/genererPartenairesPDF");
const genererXLSX = require("./helpers/genererSerialisationXLSX");
const genererXML = require("./helpers/genererSerialisationXML");
const { genererSignature } = require("./decodeur_signature");
const { construireBibliotheque } = require("./ia_constructeur");

const app = express();
const PORT = process.env.PORT || 10000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ storage: multer.memoryStorage() });

/* ==========================================================
   FONCTIONS OUTILS
========================================================== */

function genererNumeroForge() {
    const d = new Date();
    return "ANOR-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function genererSerialisation(quantite) {
    const liste = [];
    for (let i = 1; i <= quantite; i++) {
        liste.push("ANOR-" + String(i).padStart(8, "0"));
    }
    return liste;
}

/* ==========================================================
   ROUTE API FORGE
========================================================== */

app.post("/api/forge", upload.fields([{ name: "visuel", maxCount: 1 }, { name: "certificat_pdf", maxCount: 1 }]), async (req, res) => {
    try {
        const body = req.body;
        const { nom_produit, nom_producteur, lot, pays_origine, composition, type_emballage } = body;
        const quantite = parseInt(body.quantite || 1);
        
        // 1. Signature synchronisée
        const signature = [nom_produit, nom_producteur, lot, pays_origine, quantite].join("_");
        const identifiant = genererNumeroForge();
        const serialisation = genererSerialisation(quantite);
        
        // 2. Construction ADN (Compositeur partagé)
        const instructions = Compositeur.composer(signature);
        const bibliotheque = construireBibliotheque(signature);

        const tempFolder = path.join(__dirname, "generated", identifiant);
        fs.mkdirSync(tempFolder, { recursive: true });

        // 3. Génération Sceau & Documents
        const sceauPath = await genererSceau(signature, identifiant, instructions);
        fs.writeFileSync(path.join(tempFolder, "05_Serialisation.csv"), "NumeroSerie\n" + serialisation.join("\n"), "utf8");
        await genererXLSX(serialisation, path.join(tempFolder, "05_Serialisation.xlsx"));
        await genererXML(serialisation, path.join(tempFolder, "05_Serialisation.xml"));
        await genererGuidePDF(path.join(tempFolder, "03_Guide_Impression.pdf"));
        await genererJuridiquePDF(path.join(tempFolder, "04_Avertissement_Juridique.pdf"));
        await genererPartenairesPDF(path.join(tempFolder, "06_Partenaires_Impression.pdf"));

        // 4. Upload Storage Supabase
        let visuelURL = null;
        if (req.files?.visuel) {
            const f = req.files.visuel[0];
            const pathS = `produits/${identifiant}_${f.originalname}`;
            await supabase.storage.from("produits").upload(pathS, f.buffer, { contentType: f.mimetype });
            visuelURL = supabase.storage.from("produits").getPublicUrl(pathS).data.publicUrl;
        }

        let certURL = null;
        if (req.files?.certificat_pdf) {
            const f = req.files.certificat_pdf[0];
            const pathS = `certificats/${identifiant}.pdf`;
            await supabase.storage.from("certificats").upload(pathS, f.buffer, { contentType: f.mimetype });
            certURL = supabase.storage.from("certificats").getPublicUrl(pathS).data.publicUrl;
        }

        // 5. Base de données
        const insertion = { identifiant, nom_produit, nom_producteur, lot, pays_origine, quantite, signature, bibliotheque_formes: JSON.stringify(bibliotheque), serialisation: JSON.stringify(serialisation), visuel_url: visuelURL, certificat_url: certURL };
        await supabase.from("sya_produit_certifie").insert(insertion);

        // 6. ZIP Final
        const zip = new JSZip();
        zip.file("00_Sceau_Maitre.png", fs.readFileSync(sceauPath));
        if (req.files?.visuel) zip.file("01_Visuel_Produit" + path.extname(req.files.visuel[0].originalname), req.files.visuel[0].buffer);
        if (req.files?.certificat_pdf) zip.file("02_Certificat_Conformite.pdf", req.files.certificat_pdf[0].buffer);
        zip.file("03_Guide_Impression.pdf", fs.readFileSync(path.join(tempFolder, "03_Guide_Impression.pdf")));
        zip.file("04_Avertissement_Juridique.pdf", fs.readFileSync(path.join(tempFolder, "04_Avertissement_Juridique.pdf")));
        zip.file("05_Serialisation.csv", fs.readFileSync(path.join(tempFolder, "05_Serialisation.csv")));
        zip.file("05_Serialisation.xlsx", fs.readFileSync(path.join(tempFolder, "05_Serialisation.xlsx")));
        zip.file("05_Serialisation.xml", fs.readFileSync(path.join(tempFolder, "05_Serialisation.xml")));
        zip.file("06_Partenaires_Impression.pdf", fs.readFileSync(path.join(tempFolder, "06_Partenaires_Impression.pdf")));
        zip.file("08_Manifeste.json", JSON.stringify(insertion, null, 4));

        const contenuZIP = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
        await supabase.storage.from("kits").upload(`kits/${identifiant}.zip`, contenuZIP, { contentType: "application/zip" });
        const kitURL = supabase.storage.from("kits").getPublicUrl(`kits/${identifiant}.zip`).data.publicUrl;

        res.json({ success: true, identifiant, kit: kitURL });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(PORT, () => console.log(`ANOR V10 Forge opérationnelle sur port ${PORT}`));