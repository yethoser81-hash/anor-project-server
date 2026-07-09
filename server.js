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
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

// Modules système pour le pont IA (Python)
const { execFile } = require("child_process");
const util = require("util");
const os = require("os");

const exec = util.promisify(execFile);

// Dossier temporaire pour les scans
const TEMP = path.join(os.tmpdir(), "anor_scan");
if (!fs.existsSync(TEMP))
    fs.mkdirSync(TEMP, { recursive: true });

// Correction : On utilise une approche de module compatible
const Compositeur = require("./public/forge/compositeur.js");

// Helpers de génération
const genererSceau = require("./helpers/genererSceau");
const genererGuidePDF = require("./helpers/genererGuidePDF");
const genererJuridiquePDF = require("./helpers/genererJuridiquePDF");
const genererPartenairesPDF = require("./helpers/genererPartenairesPDF");
const genererXLSX = require("./helpers/genererSerialisationXLSX");
const genererXML = require("./helpers/genererSerialisationXML");

const { construireBibliotheque } = require("./ia_constructeur");

const app = express();
const PORT = process.env.PORT || 10000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configuration statique explicite
app.use(express.static(path.join(__dirname, "public"), {
    setHeaders: (res, path) => {
        if (path.endsWith(".js")) {
            res.setHeader("Content-Type", "application/javascript");
        }
    }
}));

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
        
        const signature = [nom_produit, nom_producteur, lot, pays_origine, quantite].join("_");
        const identifiant = genererNumeroForge();
        const serialisation = genererSerialisation(quantite);
        
        const instructions = Compositeur.composer(signature);
        const bibliotheque = construireBibliotheque(signature);

        const tempFolder = path.join(__dirname, "generated", identifiant);
        fs.mkdirSync(tempFolder, { recursive: true });

        const sceauPath = await genererSceau(signature, identifiant, instructions);
        fs.writeFileSync(path.join(tempFolder, "05_Serialisation.csv"), "NumeroSerie\n" + serialisation.join("\n"), "utf8");
        await genererXLSX(serialisation, path.join(tempFolder, "05_Serialisation.xlsx"));
        await genererXML(serialisation, path.join(tempFolder, "05_Serialisation.xml"));
        await genererGuidePDF(path.join(tempFolder, "03_Guide_Impression.pdf"));
        await genererJuridiquePDF(path.join(tempFolder, "04_Avertissement_Juridique.pdf"));
        await genererPartenairesPDF(path.join(tempFolder, "06_Partenaires_Impression.pdf"));

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

        const insertion = { identifiant, nom_produit, nom_producteur, lot, pays_origine, quantite, signature, bibliotheque_formes: JSON.stringify(bibliotheque), serialisation: JSON.stringify(serialisation), visuel_url: visuelURL, certificat_url: certURL };
        await supabase.from("sya_produit_certifie").insert(insertion);

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

/* ==========================================================
   ROUTE API SCAN (LECTURE & VÉRIFICATION)
========================================================== */

app.post("/api/scan", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) throw new Error("Photo absente");
        const lot = req.body.lot;
        if (!lot) throw new Error("Lot absent");

        const { data, error } = await supabase
            .from("sya_produit_certifie")
            .select("*")
            .eq("lot", lot)
            .single();

        if (error || !data) throw new Error("Produit inconnu");

        const imagePath = path.join(TEMP, `${Date.now()}.png`);
        fs.writeFileSync(imagePath, req.file.buffer);

        const reconstruction = await exec("python", [path.join(__dirname, "vision_decoder.py"), imagePath]);
        const lecture = JSON.parse(reconstruction.stdout);

        const comparaison = await exec("python", [path.join(__dirname, "comparateur_cryptogeometrique.py"), JSON.stringify(lecture), data.bibliotheque_formes]);
        const resultat = JSON.parse(comparaison.stdout);

        res.json({
            success: true,
            produit: data.nom_produit,
            score: resultat.score,
            authentique: resultat.authentique,
            details: resultat
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ==========================================================
   ROUTE API FORGE KIT (DÉDIÉE)
========================================================== */

app.post("/api/forge/kit", async (req, res) => {
    try {
        const { produit, producteur, lot, quantite, pays, signature, svg } = req.body;
        const zip = new JSZip();

        zip.file("01_SCEAU_MAITRE.svg", svg);
        zip.file("02_PRODUIT.json", JSON.stringify({ produit, producteur, lot, quantite, pays, signature, date: new Date().toISOString() }, null, 4));
        zip.file("03_SIGNATURE.txt", signature);

        let csv = "Numero\n";
        for (let i = 1; i <= Number(quantite); i++) {
            csv += `${lot}-${String(i).padStart(6, "0")}\n`;
        }
        zip.file("04_SERIALISATION.csv", csv);

        let xml = '<?xml version="1.0"?>\n<serialisation>\n';
        for (let i = 1; i <= Number(quantite); i++) {
            xml += `   <numero>${lot}-${String(i).padStart(6, "0")}</numero>\n`;
        }
        xml += "</serialisation>";
        zip.file("05_SERIALISATION.xml", xml);

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Serialisation");
        ws.columns = [{ header: "Numero", key: "numero", width: 35 }];
        for (let i = 1; i <= Number(quantite); i++) {
            ws.addRow({ numero: `${lot}-${String(i).padStart(6, "0")}` });
        }
        const xlsxBuffer = await wb.xlsx.writeBuffer();
        zip.file("06_SERIALISATION.xlsx", xlsxBuffer);

        const contenu = await zip.generateAsync({ type: "nodebuffer" });
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

app.listen(PORT, () => console.log(`ANOR V10 Forge opérationnelle sur port ${PORT}`));