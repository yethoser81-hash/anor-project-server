// ==========================================================
// helpers/genererSceau.js
// Génération automatique du sceau maître PNG
// ==========================================================

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// Au lieu de ../public/forge/compositeur
const path = require('path');
const Compositeur = require(path.join(__dirname, '..', 'public', 'forge', 'compositeur.js'));
const DessinGlyphes = require(path.join(__dirname, '..', 'public', 'forge', 'dessin_glyphes.js'));

async function genererSceauPNG(signature, identifiant)
{
    const canvas = createCanvas(500,500);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle="#FFFFFF";
    ctx.fillRect(0,0,500,500);

    const instructions =
        Compositeur.composer(signature);

    instructions.forEach(inst=>{

        DessinGlyphes.dessinerCanvas(
            ctx,
            inst.glyphe,
            inst.angle,
            inst.rayon
        );

    });

    const dossier =
        path.join(
            __dirname,
            "..",
            "generated",
            "sceaux"
        );

    fs.mkdirSync(dossier,{recursive:true});

    const fichier =
        path.join(
            dossier,
            identifiant+".png"
        );

    fs.writeFileSync(
        fichier,
        canvas.toBuffer("image/png")
    );

    return fichier;
}

module.exports=genererSceauPNG;