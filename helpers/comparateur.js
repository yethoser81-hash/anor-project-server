/**
 * helpers/comparateur.js
 * ANOR V11.1
 * Comparaison par index géométrique
 */

const TOLERANCE_ANGLE = 6;
const TOLERANCE_RAYON = 12;

function creerIndex(liste){

    const index = {};

    for(const g of liste){

        const cle =
            `${g.anneau}_${g.position}`;

        index[cle]=g;

    }

    return index;

}

function comparerSignature(scan, reference){

    if(
        !scan ||
        !reference ||
        !scan.length ||
        !reference.length
    ){
        return 0;
    }

    const scanIndex =
        creerIndex(scan);

    let correspondances = 0;

    for(const ref of reference){

        const cle =
            `${ref.anneau}_${ref.position}`;

        const lu =
            scanIndex[cle];

        if(!lu)
            continue;

        if(lu.forme!==ref.forme)
            continue;

        if(lu.plein!==ref.plein)
            continue;

        let diffAngle =
            Math.abs(
                lu.angle-ref.angle
            );

        if(diffAngle>180)
            diffAngle=360-diffAngle;

        const diffRayon =
            Math.abs(
                lu.rayon-ref.rayon
            );

        if(
            diffAngle<=TOLERANCE_ANGLE &&
            diffRayon<=TOLERANCE_RAYON
        ){
            correspondances++;
        }

    }

    return Number(
        (
            correspondances/
            reference.length
        ).toFixed(4)
    )*100;

}

module.exports={
    comparerSignature
};