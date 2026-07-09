/**
 * dessin_primitives.js
 * Bibliothèque des primitives SVG
 */

const Primitives = {

    creerForme(data) {

        const forme = data.forme || "carre";

        const plein = data.plein
            ? "fill='#0057B8'"
            : "fill='none' stroke='#0057B8' stroke-width='1.4'";

        switch(forme){

            case "cercle":

                return `
                <circle
                    cx="0"
                    cy="0"
                    r="5"
                    ${plein}/>
                `;

            case "carre":

                return `
                <rect
                    x="-5"
                    y="-5"
                    width="10"
                    height="10"
                    ${plein}/>
                `;

            case "rectangle":

                return `
                <rect
                    x="-3"
                    y="-14"
                    width="6"
                    height="28"
                    rx="1"
                    ${plein}/>
                `;

            case "barre_verticale":

                return `
                <rect
                    x="-2.8"
                    y="-18"
                    width="5.6"
                    height="36"
                    rx="1"
                    ${plein}/>
                `;

            case "losange":

                return `
                <polygon
                    points="0,-7 7,0 0,7 -7,0"
                    ${plein}/>
                `;

            case "croix":

                return `
                <g stroke="#0057B8" stroke-width="1.8">
                    <line x1="-5" y1="0" x2="5" y2="0"/>
                    <line x1="0" y1="-5" x2="0" y2="5"/>
                </g>
                `;

            default:

                return `
                <rect
                    x="-5"
                    y="-5"
                    width="10"
                    height="10"
                    ${plein}/>
                `;
        }

    }

};

if(typeof module!="undefined")
    module.exports=Primitives;

if(typeof window!="undefined")
    window.Primitives=Primitives;