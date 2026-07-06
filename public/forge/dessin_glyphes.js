/**
 * dessin_glyphes.js
 * Responsable de la mise en forme spatiale des éléments.
 * Il ne décide plus du choix du glyphe, il l'affiche selon les instructions reçues.
 */

const Primitives = require('./dessin_primitives.js');

const DessinGlyphes = {
    /**
     * @param {number} angle - Angle de positionnement sur l'anneau
     * @param {number} rayon - Rayon de l'anneau
     * @param {Object} glypheData - Les données du glyphe (id, forme, plein) fournies par le Compositeur
     */
    creerGlyphe: function(angle, rayon, glypheData) {
        // 1. Création de la primitive via le module Primitives
        const el = Primitives.creerForme(glypheData);
        
        // 2. Calcul des coordonnées cartésiennes pour le placement
        // Le centre du sceau est supposé être à 250px
        const x = 250 + rayon * Math.cos(angle) - 5;
        const y = 250 + rayon * Math.sin(angle) - 5;
        
        // 3. Application du style positionnel
        el.style.position = 'absolute'; // S'assure que l'élément peut bouger
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        
        // 4. Rotation pour que la forme suive la courbure de l'anneau
        el.style.transform = `rotate(${angle}rad)`;
        
        return el;
    }
};

module.exports = DessinGlyphes;