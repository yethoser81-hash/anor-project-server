/**
 * forgeRenderer.js
 * Version avec logo embarqué dans le SVG
 */

const ForgeRenderer = {

    logoData: null,

    async chargerLogo() {

        if (this.logoData) return this.logoData;

        const response = await fetch("/assets/logo_anor_master.png");

        const blob = await response.blob();

        this.logoData = await new Promise(resolve => {

            const reader = new FileReader();

            reader.onload = e => resolve(e.target.result);

            reader.readAsDataURL(blob);

        });

        return this.logoData;

    },

    async render(containerId, cle = "ANOR_DEFAULT") {

        const container = document.getElementById(containerId);

        if (!container) {

            console.error(containerId);

            return;

        }

        const logo = await this.chargerLogo();

        let svg = `

<svg
width="500"
height="500"
viewBox="0 0 500 500"
xmlns="http://www.w3.org/2000/svg">

<circle
cx="250"
cy="250"
r="240"
fill="none"
stroke="#0057B8"
stroke-width="8"/>

<circle
cx="250"
cy="250"
r="236"
fill="none"
stroke="#0057B8"
stroke-width="2"/>

`;

        const instructions = window.Compositeur.composer(cle);

        instructions.forEach(inst => {

            svg += window.DessinGlyphes.creerGlyphe(

                inst.angle,

                inst.rayon,

                inst.glyphe

            );

        });

        svg += `

<circle
cx="250"
cy="250"
r="68"
fill="none"
stroke="#0057B8"
stroke-width="2"/>

`;

        svg += `

<image
href="${logo}"
x="170"
y="170"
width="160"
height="160"
preserveAspectRatio="xMidYMid meet"/>

`;

        svg += `

</svg>

`;

        container.innerHTML = svg;

    }

};

window.ForgeRenderer = ForgeRenderer;