/**
 * ==========================================================
 * helpers/genererSceau.js
 * ANOR-SOFT
 * 
 * Générateur officiel du sceau
 * Source unique : SVG
 * ==========================================================
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ForgeRenderer = require(
    path.join(
        __dirname,
        "..",
        "public",
        "forge",
        "forgeRenderer.js"
    )
);

async function genererSceau(signature, identifiant){

    const dossier = path.join(
        __dirname,
        "..",
        "generated",
        identifiant
    );

    // Vérification de sécurité avant création
    if (!fs.existsSync(dossier)) {
        fs.mkdirSync(
            dossier,
            {
                recursive:true
            }
        );
    }

    const logoPath = path.join(
        __dirname,
        "..",
        "public",
        "assets",
        "logo_anor_master.png"
    );

    let logoBase64 = null;

    if(fs.existsSync(logoPath)){

        const buffer =
            fs.readFileSync(logoPath);

        logoBase64 =
        "data:image/png;base64,"+
        buffer.toString("base64");

    }

    /*
        Génération SVG officielle
        Même moteur que l'écran forge
    */

    const svg =
        await ForgeRenderer.renderSVG(
            signature,
            logoBase64
        );

    const fichierSVG =
        path.join(
            dossier,
            "00_Sceau_Maitre.svg"
        );

    fs.writeFileSync(
        fichierSVG,
        svg,
        "utf8"
    );

    const fichierPNG =
        path.join(
            dossier,
            "00_Sceau_Maitre.png"
        );

    await sharp(
        Buffer.from(svg)
    )
    .resize(
        {
            width:1200,
            height:1200,
            fit:"contain"
        }
    )
    .png()
    .toFile(
        fichierPNG
    );

    return {

        svg:fichierSVG,

        png:fichierPNG

    };

}

module.exports = genererSceau;