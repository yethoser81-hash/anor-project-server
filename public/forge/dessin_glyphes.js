/**
 * dessin_glyphes.js
 * Positionnement des glyphes
 */

(function(){

const P=(typeof window!=="undefined")
    ? window.Primitives
    : require("./dessin_primitives.js");

const DessinGlyphes={

    creerGlyphe(angle,rayon,glyphe){

        const primitive=P.creerForme(glyphe);

        const x=250+rayon*Math.cos(angle);

        const y=250+rayon*Math.sin(angle);

        /*
            Les glyphes suivent
            la tangente de l'anneau.
        */

        const rotation=angle*180/Math.PI+90;

        return `

<g
transform="
translate(${x},${y})
rotate(${rotation})
">

${primitive}

</g>

`;

    }

};

if(typeof module!=="undefined")
    module.exports=DessinGlyphes;

if(typeof window!=="undefined")
    window.DessinGlyphes=DessinGlyphes;

})();