/**
 * FORGE RENDERER - ANOR V11 (Synchronisé)
 * Moteur unifié, compatible Browser + Node.
 */

(function(){

// Sécurisation stricte de l'accès au Compositeur
const getCompositeur = () => {
    // Côté Navigateur
    if (typeof window !== "undefined" && window.Compositeur) {
        return window.Compositeur;
    }
    // Côté Serveur (Node.js) : Utilisation du chemin absolu pour éviter les erreurs de "Require stack"
    if (typeof module !== "undefined" && typeof __dirname !== "undefined") {
        const path = require('path');
        return require(path.join(__dirname, 'compositeur.js'));
    }
    return null;
};

const ForgeRenderer = {
    logoData: null,

    async chargerLogoNavigateur() {
        if(this.logoData) return this.logoData;
        try {
            const response = await fetch("/assets/logo_anor_master.png");
            if (!response.ok) return null;
            const blob = await response.blob();
            this.logoData = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(blob);
            });
            return this.logoData;
        } catch (e) {
            return null;
        }
    },

    async renderSVG(signature = "ANOR_DEFAULT", logoBase64 = null) {
        const Compositeur = getCompositeur();
        if (!Compositeur) {
            throw new Error("Moteur Compositeur introuvable.");
        }
        
        const instructions = Compositeur.composer(
        signature,
        {
        zoneSerie:true
        }
        );
        
        let svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <circle cx="250" cy="250" r="238" fill="none" stroke="#0057B8" stroke-width="10"/>
    <circle cx="250" cy="250" r="228" fill="none" stroke="#0057B8" stroke-width="2"/>
`;

        instructions.forEach(inst => {
            svg += this.creerGlypheSVG(inst.angle, inst.rayon, inst.glyphe);
        });

        svg += `<circle cx="250" cy="250" r="74" fill="none" stroke="#0057B8" stroke-width="3"/>`;

        if(logoBase64) {
            svg += `<image href="${logoBase64}" x="170" y="170" width="160" height="160" preserveAspectRatio="xMidYMid meet"/>`;
        }

        svg += `</svg>`;
        return svg;
    },

    creerGlypheSVG(angle, rayon, glyphe) {
        const x = 250 + Math.cos(angle) * rayon;
        const y = 250 + Math.sin(angle) * rayon;

        const fill = glyphe.plein ? "#0057B8" : "white";
        const stroke = "#0057B8";

        switch (glyphe.forme) {

            case "cercle":
                return `
                <circle
                    cx="${x}"
                    cy="${y}"
                    r="8"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="3"
                />
                `;

            case "carre":
                return `
                <rect
                    x="${x-8}"
                    y="${y-8}"
                    width="16"
                    height="16"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="3"
                />
                `;

            case "rectangle":
                return `
                <rect
                    x="${x-16}"
                    y="${y-6}"
                    width="32"
                    height="12"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="2.5"
                />
                `;

            case "barre_verticale":
                return `
                <rect
                    x="${x-3}"
                    y="${y-11}"
                    width="6"
                    height="22"
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="2"
                />
                `;

            case "losange":
                return `
                <polygon
                    points="
                        ${x},${y-9}
                        ${x+9},${y}
                        ${x},${y+9}
                        ${x-9},${y}
                    "
                    fill="${fill}"
                    stroke="${stroke}"
                    stroke-width="3"
                />
                `;

            case "croix":
                return `
                <path
                    d="
                        M ${x-8} ${y}
                        L ${x+8} ${y}
                        M ${x} ${y-8}
                        L ${x} ${y+8}
                    "
                    stroke="${stroke}"
                    stroke-width="4"
                    stroke-linecap="square"
                />
                `;

            default:
                return "";
        }
    },

    async render(containerId, signature = "ANOR_DEFAULT") {
        if(typeof window === "undefined") return;
        const container = document.getElementById(containerId);
        if(!container) return;

        const logo = await this.chargerLogoNavigateur();
        const svg = await this.renderSVG(signature, logo);
        container.innerHTML = svg;
    }
};

if(typeof module !== "undefined") module.exports = ForgeRenderer;
if(typeof window !== "undefined") window.ForgeRenderer = ForgeRenderer;

})();