/**
 * dessin_primitives.js
 * Responsable de la création des nœuds DOM bruts.
 * Chaque élément reçoit son identifiant unique pour le scan APK.
 */

const Primitives = {
    /**
     * @param {Object} data - Objet contenant {id, forme, plein}
     * @returns {HTMLElement}
     */
    creerForme: function(data) {
        const el = document.createElement('div');
        
        // Construction des classes CSS
        const baseClass = "shape";
        const formClass = data.forme || "square";
        const fillClass = data.plein ? "filled" : "";
        
        el.className = `${baseClass} ${formClass} ${fillClass}`.trim();
        
        // ID vital pour la lecture par l'APK
        el.setAttribute('data-id', data.id || "UNKNOWN");
        
        return el;
    }
};

module.exports = Primitives;