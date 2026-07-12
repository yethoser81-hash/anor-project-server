/**
 * ==========================================================
 * ia_constructeur.js
 * ANOR V10
 * Passerelle sécurisée vers la bibliothèque de glyphes
 * ==========================================================
 */

const path = require("path");

// Chargement sécurisé de la bibliothèque
const GLYPHES_SOURCE = require(
    path.join(__dirname, "public", "forge", "bibliotheque_glyphes.js")
);

// Immutabilité : empêche toute altération malveillante de la bibliothèque en mémoire
const GLYPHES_SECURISE = Object.freeze([...GLYPHES_SOURCE]);

/**
 * Accès sécurisé aux données des glyphes
 * Retourne une copie en lecture seule
 */
const getBibliotheque = () => GLYPHES_SECURISE;

/**
 * Validation d'un index pour prévenir les accès hors limites (Out-of-bounds)
 */
const getGlypheParIndex = (index) => {
    const i = parseInt(index, 10);
    if (isNaN(i) || i < 0 || i >= GLYPHES_SECURISE.length) {
        return GLYPHES_SECURISE[0]; // Retourne un glyphe par défaut sécurisé
    }
    return GLYPHES_SECURISE[i];
};

module.exports = {
    getBibliotheque,
    getGlypheParIndex
};