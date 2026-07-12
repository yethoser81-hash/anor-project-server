/**
 * FORGE LOGIC - ANOR V10
  */

const ForgeCore = {
    // 1. PRIMITIVES
    creerForme(data) {
        const forme = data.forme || "carre";
        const plein = data.plein ? "fill='#0057B8'" : "fill='none' stroke='#0057B8' stroke-width='1.4'";
        
        const shapes = {
            "cercle": `<circle cx="0" cy="0" r="5" ${plein}/>`,
            "carre": `<rect x="-5" y="-5" width="10" height="10" ${plein}/>`,
            "rectangle": `<rect x="-3" y="-14" width="6" height="28" rx="1" ${plein}/>`,
            "barre_verticale": `<rect x="-2.8" y="-18" width="5.6" height="36" rx="1" ${plein}/>`,
            "losange": `<polygon points="0,-7 7,0 0,7 -7,0" ${plein}/>`,
            "croix": `<g stroke="#0057B8" stroke-width="1.8"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/></g>`
        };
        return shapes[forme] || shapes["carre"];
    },

    // 2. POSITIONNEMENT DES GLYPHES
    creerGlyphe(angle, rayon, glyphe) {
        const primitive = this.creerForme(glyphe);
        const x = 250 + rayon * Math.cos(angle);
        const y = 250 + rayon * Math.sin(angle);
        const rotation = angle * 180 / Math.PI + 90;
        return `<g transform="translate(${x},${y}) rotate(${rotation})">${primitive}</g>`;
    },

    // 3. MOTEUR DE COMPOSITION
    composer(cle) {
        // Supposons que BIBLIOTHEQUE_GLYPHES est global ou importé
        const G = (typeof window !== "undefined") ? window.BIBLIOTHEQUE_GLYPHES : require("./bibliotheque_glyphes.js");
        const seed = this.hashCle(cle);
        let instructions = [];
        const rayons = [210, 170, 130];
        const densites = [34, 28, 22];

        rayons.forEach((rayon, r) => {
            const nb = densites[r];
            for (let i = 0; i < nb; i++) {
                if (((seed + i + r) % 11) === 0) continue;
                instructions.push({
                    glyphe: G[(seed + i * 9 + r * 17) % G.length],
                    angle: (i / nb) * Math.PI * 2,
                    rayon: rayon
                });
            }
        });
        return instructions;
    },

    hashCle(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }
};

// Exportation universelle
if (typeof module !== "undefined") module.exports = ForgeCore;
if (typeof window !== "undefined") window.ForgeCore = ForgeCore;