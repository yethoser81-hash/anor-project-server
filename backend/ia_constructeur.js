/**
 * ============================================================
 * ia_constructeur.js
 * ANOR V3
 * IA Constructeur des glyphes
 * ============================================================
 */

const GLYPHES = require("./bibliotheque_glyphes");

/*==========================================================
UTILITAIRES
==========================================================*/

function bitsToInt(bits){

    return parseInt(bits,2);

}

function lireBloc(signature,debut,longueur){

    let chaine="";

    while(chaine.length<longueur){

        chaine+=signature;

    }

    return chaine.substring(debut,debut+longueur);

}

/*==========================================================
CONSTRUCTION D'UN GLYPHE
==========================================================*/

function construireGlyphe(signature,index,rayonBase){

    const bloc=lireBloc(

        signature,

        index*6,

        12

    );

    const valeur=bitsToInt(bloc);

    const glyphe=

        GLYPHES[

            valeur%

            GLYPHES.length

        ];

    const poids =
        (valeur % 100) / 100;

    const famille =
        (valeur >> 3) % 8;

    const variation =
        (valeur >> 5) % 16;

    return{

        id:index,

        valeur,

        glyphe,

        angleSeed:
            valeur%360,

        rayon:
            rayonBase+
            ((valeur>>2)%20)-10,

        niveau:
            (valeur>>5)%3,

        orientation:
            valeur%360,

        taille:
            0.8+
            ((valeur>>3)%5)*0.15,

        cluster:
            (valeur>>7)%4,

        espace:
            5+
            (valeur%9),

        miroir:
            (valeur&1)==1,

        couleur:
            (valeur>>4)%3,

        epaisseur:
            1+
            (valeur%2),

        poids,

        famille,

        variation

    };

}

/*==========================================================
CONSTRUCTION D'UN ANNEAU
==========================================================*/

function construireAnneau(

    signature,

    debut,

    nombre,

    rayon

){

    const liste=[];

    for(

        let i=0;

        i<nombre;

        i++

    ){

        liste.push(

            construireGlyphe(

                signature,

                debut+i,

                rayon

            )

        );

    }

    return liste;

}

/*==========================================================
CONSTRUCTEUR GLOBAL
==========================================================*/

function construireBibliotheque(signature){

    if(!signature)
        throw new Error("Signature absente.");

    if(signature.length!==90)
        throw new Error("Signature invalide.");

    return{

        signature,

        meta:{

            version:3,

            densite:24,

            signatureBits:90

        },

        noyau:
            construireAnneau(
                signature,
                0,
                6,
                240
            ),

        transition:
            construireAnneau(
                signature,
                6,
                8,
                330
            ),

        peripherie:
            construireAnneau(
                signature,
                14,
                10,
                425
            )

    };

}

module.exports=

construireBibliotheque;