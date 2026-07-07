/**
 * ==========================================================
 * helpers/genererSceau.js
 * Rendu final du Sceau Maître (PNG)
 * ==========================================================
 */

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// Import des moteurs partagés
const Compositeur = require(path.join(__dirname, "..", "public", "forge", "compositeur.js"));
const DessinGlyphes = require(path.join(__dirname, "..", "public", "forge", "dessin_glyphes.js"));

/**
 * Génère le sceau physique à partir des instructions calculées
 * @param {string} signature - La chaîne de signature
 * @param {string} identifiant - Le numéro de forge
 * @param {Array} instructions - Les instructions fournies par le Compositeur
 */
async function genererSceau(signature, identifiant, instructions) {
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext("2d");

    // Fond blanc
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 500, 500);

    // Dessin basé sur les instructions fournies
    instructions.forEach(inst => {
        DessinGlyphes.dessinerCanvas(
            ctx,
            inst.glyphe,
            inst.angle,
            inst.rayon
        );
    });

    // Sauvegarde physique
    const dossier = path.join(__dirname, "..", "generated", identifiant);
    fs.mkdirSync(dossier, { recursive: true });

    const fichier = path.join(dossier, "00_Sceau_Maitre.png");
    
    fs.writeFileSync(fichier, canvas.toBuffer("image/png"));

    return fichier;
}

module.exports = genererSceau;