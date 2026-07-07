/**
 * ==========================================================
 * server.js
 * ANOR V10
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

const genererSceauPNG = require("./helpers/genererSceau");
const genererGuidePDF = require("./helpers/genererGuidePDF");
const genererJuridiquePDF = require("./helpers/genererJuridiquePDF");
const genererPartenairesPDF = require("./helpers/genererPartenairesPDF");
const genererXLSX = require("./helpers/genererSerialisationXLSX");
const genererXML = require("./helpers/genererSerialisationXML");

const {
    genererSignature
} = require("./decodeur_signature");

const {
    construireBibliotheque
} = require("./ia_constructeur");

const app = express();

const PORT = process.env.PORT || 10000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.use(cors());

app.use(express.json({
    limit: "50mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));

app.use(express.static(
    path.join(__dirname, "public")
));

const upload = multer({
    storage: multer.memoryStorage()
});



/* ==========================================================
   OUTILS
========================================================== */

function genererNumeroForge() {

    const d = new Date();

    return "ANOR-" +

        d.getFullYear() +

        String(d.getMonth() + 1).padStart(2, "0") +

        String(d.getDate()).padStart(2, "0") +

        "-" +

        crypto.randomBytes(4)
        .toString("hex")
        .toUpperCase();

}



function genererSerialisation(quantite) {

    const liste = [];

    for (let i = 1; i <= quantite; i++) {

        liste.push(

            "ANOR-" +

            String(i).padStart(8, "0")

        );

    }

    return liste;

}



/* ==========================================================
   ACCUEIL
========================================================== */

app.get("/", (req, res) => {

    res.sendFile(

        path.join(

            __dirname,

            "public",

            "dashboard",

            "index.html"

        )

    );

});



/* ==========================================================
   FORGE
========================================================== */

app.post(

"/api/forge",

upload.fields([

{
    name:"visuel",
    maxCount:1
},

{
    name:"certificat_pdf",
    maxCount:1
}

]),

async(req,res)=>{

try{

const body=req.body;

const nom_produit=body.nom_produit;

const nom_producteur=body.nom_producteur;

const composition=body.composition;

const lot=body.lot;

const pays_origine=body.pays_origine;

const type_emballage=body.type_emballage;

const quantite=parseInt(
body.quantite_totale || 1
);

const nonce=
crypto.randomBytes(16)
.toString("hex");

const signature=

genererSignature(

nom_produit,

nom_producteur,

lot,

pays_origine,

nonce,

process.env.SEAU_SECRET

);

const bibliotheque=

construireBibliotheque(signature);

const identifiant=

genererNumeroForge();

const serialisation=

genererSerialisation(
quantite
);

const tempFolder=

path.join(

__dirname,

"generated",

identifiant

);

fs.mkdirSync(

tempFolder,

{

recursive:true

}

);

/* ==========================================================
   GENERATION DU SCEAU MAITRE
========================================================== */

const sceauPath = await genererSceauPNG(
    signature,
    identifiant
);



/* ==========================================================
   GENERATION CSV
========================================================== */

let csv = "NumeroSerie\n";

serialisation.forEach(numero => {

    csv += numero + "\n";

});

fs.writeFileSync(

    path.join(
        tempFolder,
        "05_Serialisation.csv"
    ),

    csv,

    "utf8"

);



/* ==========================================================
   GENERATION XLSX
========================================================== */

await genererXLSX(

    serialisation,

    path.join(
        tempFolder,
        "05_Serialisation.xlsx"
    )

);



/* ==========================================================
   GENERATION XML
========================================================== */

await genererXML(

    serialisation,

    path.join(
        tempFolder,
        "05_Serialisation.xml"
    )

);



/* ==========================================================
   GENERATION DES PDF
========================================================== */

await genererGuidePDF(

    path.join(
        tempFolder,
        "03_Guide_Impression.pdf"
    )

);

await genererJuridiquePDF(

    path.join(
        tempFolder,
        "04_Avertissement_Juridique.pdf"
    )

);

await genererPartenairesPDF(

    path.join(
        tempFolder,
        "06_Partenaires_Impression.pdf"
    )

);



/* ==========================================================
   UPLOAD VISUEL
========================================================== */

let visuelURL = null;

if (req.files?.visuel?.length) {

    const fichier = req.files.visuel[0];

    const nomStorage =
        `produits/${identifiant}_${Date.now()}_${fichier.originalname}`;

    const upload = await supabase.storage

        .from("produits")

        .upload(

            nomStorage,

            fichier.buffer,

            {

                contentType: fichier.mimetype,

                upsert: true

            }

        );

    if (upload.error)
        throw upload.error;

    visuelURL =

        supabase.storage

        .from("produits")

        .getPublicUrl(nomStorage)

        .data.publicUrl;

}



/* ==========================================================
   UPLOAD CERTIFICAT
========================================================== */

let certificatURL = null;

if (req.files?.certificat_pdf?.length) {

    const fichier = req.files.certificat_pdf[0];

    const nomStorage =
        `certificats/${identifiant}.pdf`;

    const upload = await supabase.storage

        .from("certificats")

        .upload(

            nomStorage,

            fichier.buffer,

            {

                contentType: fichier.mimetype,

                upsert: true

            }

        );

    if (upload.error)
        throw upload.error;

    certificatURL =

        supabase.storage

        .from("certificats")

        .getPublicUrl(nomStorage)

        .data.publicUrl;

}



/* ==========================================================
   INSERTION BASE
========================================================== */

const insertion = {

    identifiant,

    nom_produit,

    nom_producteur,

    composition,

    lot,

    pays_origine,

    type_emballage,

    quantite,

    signature,

    bibliotheque_formes:
        JSON.stringify(bibliotheque),

    serialisation:
        JSON.stringify(serialisation),

    couleur_sceau: "BLEU",

    version_sceau: "ANOR-V10",

    visuel_url: visuelURL,

    certificat_url: certificatURL

};

const resultat = await supabase

.from("sya_produit_certifie")

.insert(insertion)

.select()

.single();

if(resultat.error)
    throw resultat.error;

/* ==========================================================
   CREATION DU ZIP OFFICIEL
========================================================== */

const zip = new JSZip();



/* ==========================================================
   AJOUT DU SCEAU MAITRE
========================================================== */

zip.file(
    "00_Sceau_Maitre.png",
    fs.readFileSync(sceauPath)
);



/* ==========================================================
   AJOUT DU VISUEL
========================================================== */

if (req.files?.visuel?.length) {

    const fichier = req.files.visuel[0];

    zip.file(

        "01_Visuel_Produit" +

        path.extname(fichier.originalname),

        fichier.buffer

    );

}



/* ==========================================================
   AJOUT CERTIFICAT
========================================================== */

if (req.files?.certificat_pdf?.length) {

    zip.file(

        "02_Certificat_Conformite.pdf",

        req.files.certificat_pdf[0].buffer

    );

}



/* ==========================================================
   AJOUT DES PDF
========================================================== */

zip.file(

    "03_Guide_Impression.pdf",

    fs.readFileSync(

        path.join(

            tempFolder,

            "03_Guide_Impression.pdf"

        )

    )

);

zip.file(

    "04_Avertissement_Juridique.pdf",

    fs.readFileSync(

        path.join(

            tempFolder,

            "04_Avertissement_Juridique.pdf"

        )

    )

);

zip.file(

    "06_Partenaires_Impression.pdf",

    fs.readFileSync(

        path.join(

            tempFolder,

            "06_Partenaires_Impression.pdf"

        )

    )

);



/* ==========================================================
   AJOUT DES FICHIERS DE SERIALISATION
========================================================== */

zip.file(

    "05_Serialisation.csv",

    fs.readFileSync(

        path.join(

            tempFolder,

            "05_Serialisation.csv"

        )

    )

);

zip.file(

    "05_Serialisation.xlsx",

    fs.readFileSync(

        path.join(

            tempFolder,

            "05_Serialisation.xlsx"

        )

    )

);

zip.file(

    "05_Serialisation.xml",

    fs.readFileSync(

        path.join(

            tempFolder,

            "05_Serialisation.xml"

        )

    )

);



/* ==========================================================
   MANIFESTE JSON
========================================================== */

fs.writeFileSync(

    path.join(

        tempFolder,

        "08_Manifeste.json"

    ),

    JSON.stringify(

        insertion,

        null,

        4

    ),

    "utf8"

);

zip.file(

    "08_Manifeste.json",

    fs.readFileSync(

        path.join(

            tempFolder,

            "08_Manifeste.json"

        )

    )

);



/* ==========================================================
   GENERATION ZIP
========================================================== */

const contenuZIP = await zip.generateAsync({

    type: "nodebuffer",

    compression: "DEFLATE",

    compressionOptions: {

        level: 9

    }

});



/* ==========================================================
   ENVOI DU ZIP DANS SUPABASE
========================================================== */

const nomZIP =

    `kits/${identifiant}.zip`;

const uploadZIP =

    await supabase.storage

    .from("kits")

    .upload(

        nomZIP,

        contenuZIP,

        {

            contentType:

                "application/zip",

            upsert: true

        }

    );

if (uploadZIP.error)
    throw uploadZIP.error;

const kitURL =

    supabase.storage

    .from("kits")

    .getPublicUrl(

        nomZIP

    )

    .data.publicUrl;



/* ==========================================================
   REPONSE API
========================================================== */

return res.json({

    success: true,

    message:
        "Forge terminée.",

    identifiant,

    signature,

    quantite,

    sceau: sceauPath,

    visuel: visuelURL,

    certificat: certificatURL,

    kit: kitURL,

    version: "ANOR-V10",

    couleur: "BLEU"

});



}

catch(err){

console.error(err);

return res.status(500).json({

success:false,

message:err.message

});

}

});



/* ==========================================================
   LANCEMENT SERVEUR
========================================================== */

app.listen(PORT,()=>{

console.log("");

console.log("==========================================");

console.log("ANOR V10");

console.log("Forge Nationale opérationnelle");

console.log("Port :",PORT);

console.log("==========================================");

console.log("");

});