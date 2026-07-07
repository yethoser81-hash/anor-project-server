/**
 * forgeRenderer.js
 * Moteur de rendu du Sceau ANOR
 * Désormais synchronisé avec la génération SVG
 */

const ForgeRenderer = {
    render(containerId, cle = "ANOR_DEFAULT") {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error("Container introuvable :", containerId);
            return;
        }

        // 1. Initialisation de la structure SVG
        // On crée une zone de dessin de 500x500 (pour couvrir le rayon de 250)
        let svgCode = `<svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">`;

        // 2. Récupération des instructions
        const instructions = window.Compositeur.composer(cle);

        // 3. Assemblage des glyphes (chaînes SVG)
        instructions.forEach(inst => {
            svgCode += window.DessinGlyphes.creerGlyphe(
                inst.angle,
                inst.rayon,
                inst.glyphe
            );
        });

        // 4. Fermeture du tag SVG
        svgCode += `</svg>`;

        // 5. Injection directe dans le DOM
        container.innerHTML = svgCode;
        container.style.display = "block";
    }
};

window.ForgeRenderer = ForgeRenderer;