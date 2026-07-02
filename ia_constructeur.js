/**
 * ============================================================
 * ia_constructeur.js
 * ANOR V4
 * Constructeur cryptographique de glyphes
 * ============================================================
 */

const GLYPHES = require("./forge/bibliotheque_glyphes");
console.log("GLYPHES =", Array.isArray(GLYPHES), GLYPHES.length);

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

function clamp(v,min,max){

    return Math.max(min,Math.min(max,v));

}

function choixGlyphes(valeur){

    return GLYPHES[
        valeur % GLYPHES.length
    ];

}

/*==========================================================
CONSTRUCTION D'UN GLYPHE
==========================================================*/

function construireGlyphe(
    signature,
    index,
    rayonBase
){

    const bloc=lireBloc(
        signature,
        index*11,
        20
    );

    const valeur=bitsToInt(bloc);

    const modele = choixGlyphes(valeur);

    if (!modele) {
        throw new Error(
            `Glyphe introuvable (index=${index}, valeur=${valeur}, totalGlyphes=${GLYPHES.length})`
        );
    }

    return {

        id: index,

        modele,

        nom: modele.nom,

        elements: JSON.parse(
            JSON.stringify(
                modele.elements
            )
        ),

        valeur,

        rayon:
            rayonBase+
            ((valeur>>2)%18)-9,

        rotation:
            valeur%360,

        taille:
            12+
            ((valeur>>4)%14),

        epaisseur:
            0.8+
            ((valeur>>5)%4)*0.35,

        couleur:
            (valeur>>6)%3,

        miroir:
            ((valeur>>7)&1)==1,

        plein:
            ((valeur>>8)&1)==1,

        cluster:
            1+
            ((valeur>>9)%3),

        espacement:
            5+
            ((valeur>>10)%8),

        offset:
            ((valeur>>13)%14)-7,

        niveau:
            (valeur>>15)%4,

        famille:
            (valeur>>17)%8,

        variation:
            (valeur>>19)%16

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
METADONNEES
==========================================================*/

function construireMeta(signature){

    let somme=0;

    for(let i=0;i<signature.length;i++){

        somme+=Number(signature[i]);

    }

    return{

        version:4,

        longueurSignature:signature.length,

        glyphesDisponibles:GLYPHES.length,

        checksum:somme,

        densite:24

    };

}

/*==========================================================
BIBLIOTHEQUE COMPLETE
==========================================================*/

function construireBibliotheque(signature){

    if(!signature){

        throw new Error(
            "Signature absente."
        );

    }

    if(signature.length!==90){

        throw new Error(
            "Signature invalide."
        );

    }

    return{

        signature,

        meta:
            construireMeta(signature),

        noyau:
            construireAnneau(

                signature,

                0,

                18,

                245

            ),

        transition:
            construireAnneau(

                signature,

                18,

                28,

                335

            ),

        peripherie:
            construireAnneau(

                signature,

                46,

                44,

                425

            )

    };

}

module.exports=
    construireBibliotheque;