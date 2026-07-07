/**
 * forgeRenderer.js
 * Moteur de rendu du Sceau ANOR
 * Orchestre le Compositeur pour générer des sceaux déterministes.
 */

const DessinGlyphes = require('./dessin_glyphes.js');
const Compositeur = require('./compositeur.js');

const ForgeRenderer = {

    render(containerId, cle = "ANOR_DEFAULT") {

        const container = document.getElementById(containerId);

        if (!container) {
            console.error("Container introuvable :", containerId);
            return;
        }

        container.innerHTML = "";

        const instructions = Compositeur.composer(cle);

        instructions.forEach(inst => {

            const glyphe = DessinGlyphes.creerGlyphe(
                inst.angle,
                inst.rayon,
                inst.glyphe
            );

            container.appendChild(glyphe);

        });

        container.style.display = "block";

    }

};


// Backend
if (typeof module !== "undefined") {
    module.exports = ForgeRenderer;
}

// Navigateur
if (typeof window !== "undefined") {
    window.ForgeRenderer = ForgeRenderer;
}