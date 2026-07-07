/**
 * dessin_primitives.js
 * Responsable de la génération du code SVG (format universel).
 * Chaque élément est une chaîne de texte SVG pour garantir la compatibilité serveur/client.
 */

const Primitives = {
    /**
     * @param {Object} data - Objet contenant {id, forme, plein}
     * @returns {string} - Chaîne contenant le code SVG de la forme
     */
    creerForme: function(data) {
        const forme = data.forme || "square";
        const estPlein = data.plein ? "fill='black'" : "fill='none' stroke='black'";
        const id = data.id || "UNKNOWN";

        // Génération d'un fragment SVG
        // On utilise un groupe <g> pour encapsuler l'ID et la forme
        let svgContent = `<g data-id="${id}" class="shape ${forme}">`;
        
        if (forme === "circle") {
            svgContent += `<circle cx="5" cy="5" r="4" ${estPlein} />`;
        } else {
            // Par défaut, un carré
            svgContent += `<rect x="1" y="1" width="8" height="8" ${estPlein} />`;
        }
        
        svgContent += `</g>`;
        
        return svgContent;
    }
};

// Exports
if (typeof module !== "undefined") {
    module.exports = Primitives;
}
if (typeof window !== "undefined") {
    window.Primitives = Primitives;
}