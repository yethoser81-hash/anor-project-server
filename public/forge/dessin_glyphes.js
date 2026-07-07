/**
 * dessin_glyphes.js
 * Responsable de la mise en forme spatiale des éléments.
 * Il ne décide plus du choix du glyphe, il l'affiche selon les instructions reçues.
 */

// Gestion d'environnement : on utilise window.Primitives dans le navigateur, require sinon.
let Primitives;
if (typeof module !== "undefined" && module.exports) {
    Primitives = require('./dessin_primitives.js');
} else {
    Primitives = window.Primitives;
}

const DessinGlyphes = {
    /**
     * @param {number} angle - Angle de positionnement sur l'anneau (en radians)
     * @param {number} rayon - Rayon de l'anneau
     * @param {Object} glypheData - Les données du glyphe fournies par le Compositeur
     * @returns {string} - Un fragment de code SVG représentant le glyphe positionné
     */
    creerGlyphe: function(angle, rayon, glypheData) {
        // 1. Création de la primitive (retourne une chaîne SVG)
        const svgPrimitive = Primitives.creerForme(glypheData);
        
        // 2. Calcul des coordonnées pour le placement
        // Le centre du sceau est supposé être à 250, 250
        const x = 250 + rayon * Math.cos(angle) - 5;
        const y = 250 + rayon * Math.sin(angle) - 5;
        
        // 3. Transformation pour le placement et la rotation
        // On retourne un groupe SVG (<g>) qui contient la primitive
        // La rotation est convertie en degrés pour le SVG
        const angleDeg = angle * (180 / Math.PI);
        
        return `
            <g transform="translate(${x}, ${y}) rotate(${angleDeg})">
                ${svgPrimitive}
            </g>`;
    }
};

// Exports
if (typeof module !== "undefined") {
    module.exports = DessinGlyphes;
}
if (typeof window !== "undefined") {
    window.DessinGlyphes = DessinGlyphes;
}