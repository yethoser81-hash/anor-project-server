/**
 * ==========================================================
 * ia_constructeur.js
 * ANOR V10
 * Construction de la bibliothèque géométrique officielle
 * ==========================================================
 */

const path = require("path");

const GLYPHES = require(
    path.join(
        __dirname,
        "public",
        "forge",
        "bibliotheque_glyphes.js"
    )
);

const LONGUEURS = Object.freeze({
    NOYAU:20,
    TRANSITION:30,
    PERIPHERIE:40
});


function construireSequence(bits, anneau){

    if(!bits)
        return [];

    const resultat=[];

    for(let i=0;i<bits.length;i+=5){

        const bloc=bits.substring(i,i+5);

        if(bloc.length!==5)
            continue;

        const index=parseInt(bloc,2)%GLYPHES.length;

        const g=GLYPHES[index];

        resultat.push({

            id:g.id,

            forme:g.forme,

            plein:g.plein,

            valeur:g.valeur,

            anneau:anneau,

            position:i/5,

            bits:bloc

        });

    }

    return resultat;

}


function construireBibliotheque(signatureBinaire){

    if(typeof signatureBinaire!=="string")
        throw new Error("Signature invalide");

    if(signatureBinaire.length<90)
        throw new Error("Signature binaire incomplète (90 bits requis)");

    const noyauBits=
        signatureBinaire.substring(
            0,
            LONGUEURS.NOYAU
        );

    const transitionBits=
        signatureBinaire.substring(
            LONGUEURS.NOYAU,
            LONGUEURS.NOYAU+
            LONGUEURS.TRANSITION
        );

    const peripherieBits=
        signatureBinaire.substring(
            LONGUEURS.NOYAU+
            LONGUEURS.TRANSITION,
            90
        );

    return{

        noyau:
            construireSequence(
                noyauBits,
                2
            ),

        transition:
            construireSequence(
                transitionBits,
                1
            ),

        peripherie:
            construireSequence(
                peripherieBits,
                0
            )

    };

}


/**
 * Construit une séquence seule
 */
function construireSequenceSimple(bits){

    return construireSequence(bits,-1);

}


/**
 * Aplatit la bibliothèque.
 * Très utile pour la comparaison IA.
 */
function bibliothequePlate(biblio){

    return [

        ...biblio.noyau,

        ...biblio.transition,

        ...biblio.peripherie

    ];

}


module.exports={

    construireSequence:construireSequenceSimple,

    construireBibliotheque,

    bibliothequePlate

};