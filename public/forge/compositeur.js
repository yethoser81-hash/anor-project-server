/**
 * compositeur.js
 */

let G;

if (typeof module !== "undefined" && module.exports) {
    G = require("./bibliotheque_glyphes.js");
} else {
    G = window.BIBLIOTHEQUE_GLYPHES;
}

const Compositeur = {

    composer(cle){

        const seed=this.hashCle(cle);

        let instructions=[];

        /*
            Seulement 3 anneaux
        */

        const rayons=[210,170,130];

        /*
            Plus de glyphes
            sur le premier anneau
        */

        const densites=[34,28,22];

        rayons.forEach((rayon,r)=>{

            const nb=densites[r];

            for(let i=0;i<nb;i++){

                /*
                    petits espaces uniquement
                */

                if(((seed+i+r)%11)==0) continue;

                const angle=(i/nb)*Math.PI*2;

                const index=(seed+i*9+r*17)%G.length;

                instructions.push({

                    glyphe:G[index],

                    angle:angle,

                    rayon:rayon

                });

            }

        });

        return instructions;

    },

    hashCle(str){

        let hash=0;

        for(let i=0;i<str.length;i++){

            hash=str.charCodeAt(i)+((hash<<5)-hash);

        }

        return Math.abs(hash);

    }

};

if(typeof module!=="undefined")
    module.exports=Compositeur;

if(typeof window!=="undefined")
    window.Compositeur=Compositeur;