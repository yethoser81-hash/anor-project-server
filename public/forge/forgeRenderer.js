/**
 * forgeRenderer.js
 * Moteur de rendu du Sceau ANOR
 * Orchestre le Compositeur pour générer des sceaux déterministes.
 */

const DessinGlyphes = require('./dessin_glyphes.js');
const Compositeur = require('./compositeur.js');

const ForgeRenderer = {
    /**
     * @param {string} containerId - ID du conteneur HTML
     * @param {string} cle - La clé unique pour générer le sceau (ex: ID utilisateur)
     */
    render: function(containerId, cle = "SERGES_ANOR_DEFAULT") {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        // 1. On récupère les instructions de composition via le Compositeur
        const instructions = Compositeur.composer(cle);

        // 2. On exécute le rendu selon les instructions reçues
        instructions.forEach((inst) => {
            // DessinGlyphes.creerGlyphe a été adapté pour accepter un glyphe spécifique
            const glypheEl = DessinGlyphes.creerGlyphe(inst.angle, inst.rayon, inst.glyphe);
            container.appendChild(glypheEl);
        });

        container.style.display = 'block';
    }
};

module.exports = ForgeRenderer;