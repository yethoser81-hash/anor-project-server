/**
 * bibliotheque_glyphes.js
 * Définit les glyphes utilisés pour la génération, liés à leurs valeurs de vérification.
 */

let FormesRef;

if(typeof module!=="undefined" && module.exports){

    FormesRef=require("./bibliotheque_formes.js");

}else{

    FormesRef=window.BIBLIOTHEQUE_FORMES;

}

// Remplace ton ancienne ligne par ce bloc sécurisé :
const getVal = (nom) => {
    const forme = FormesRef.find(f => f.nom === nom);
    if (!forme) {
        throw new Error(`Erreur critique : La forme '${nom}' n'est pas définie dans bibliotheque_formes.js`);
    }
    return forme.valeur;
};

const BIBLIOTHEQUE_GLYPHES = [
    // Carrés
    { id: "S01", forme: "carre", plein: true, valeur: getVal("carre") },
    { id: "S02", forme: "carre", plein: false, valeur: getVal("carre") },
    
    // Rectangles
    { id: "R01", forme: "rectangle", plein: true, valeur: getVal("rectangle") },
    { id: "R02", forme: "rectangle", plein: false, valeur: getVal("rectangle") },
    
    // Cercles
    { id: "C01", forme: "cercle", plein: true, valeur: getVal("cercle") },
    { id: "C02", forme: "cercle", plein: false, valeur: getVal("cercle") },
    
    // Losanges
    { id: "D01", forme: "losange", plein: true, valeur: getVal("losange") },
    { id: "D02", forme: "losange", plein: false, valeur: getVal("losange") },
    
    // Croix
    { id: "P01", forme: "croix", plein: false, valeur: getVal("croix") },
    
    // Barres
    { id: "B01", forme: "barre_verticale", plein: true, valeur: getVal("barre_verticale") },
    { id: "B02", forme: "barre_verticale", plein: false, valeur: getVal("barre_verticale") }
];

if(typeof module!=="undefined" && module.exports){
    module.exports = BIBLIOTHEQUE_GLYPHES;
}

if(typeof window!=="undefined"){
    window.BIBLIOTHEQUE_GLYPHES = BIBLIOTHEQUE_GLYPHES;
}