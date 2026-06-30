/**
 * ============================================================
 * compositeur.js
 * ANOR V3
 * Compositeur graphique officiel
 * ============================================================
 */

function composerAnneau(liste, rayonBase){

    let angle = 0;

    const resultat = [];

    liste.forEach(item=>{

        /* respiration */

        angle += 6 + item.espace;

        /* groupe */

        const repetitions =

            1 +

            item.cluster;

        for(let i=0;i<repetitions;i++){

            resultat.push({

                ...item,

                angle:

                    angle +

                    i*1.8,

                rayon:

                    rayonBase +

                    item.niveau*7 +

                    (i*1.2),

                importance:

                    repetitions,

                repetition:

                    i

            });

        }

        /* vide */

        angle +=

            3 +

            item.poids*6;

    });

    return resultat;

}

/*==========================================================*/

function composerBibliotheque(bibliotheque){

    return{

        signature:

            bibliotheque.signature,

        noyau:

            composerAnneau(

                bibliotheque.noyau,

                240

            ),

        transition:

            composerAnneau(

                bibliotheque.transition,

                330

            ),

        peripherie:

            composerAnneau(

                bibliotheque.peripherie,

                425

            )

    };

}

module.exports=

composerBibliotheque;