/**
 * bibliotheque_glyphes.js
 * Définit les glyphes utilisés pour la génération, liés à leurs valeurs de vérification.
 */

const FormesRef = require('./bibliotheque_formes.js');

// Fonction utilitaire pour récupérer la valeur selon le nom
const getVal = (nom) => FormesRef.find(f => f.nom === nom).valeur;

const G = [
    // Carrés
    { id: "S01", forme: "square", plein: true, valeur: getVal("square") },
    { id: "S02", forme: "square", plein: false, valeur: getVal("square") },
    
    // Rectangles
    { id: "R01", forme: "rect", plein: true, valeur: getVal("rect") },
    { id: "R02", forme: "rect", plein: false, valeur: getVal("rect") },
    
    // Cercles
    { id: "C01", forme: "circle", plein: true, valeur: getVal("circle") },
    { id: "C02", forme: "circle", plein: false, valeur: getVal("circle") },
    
    // Losanges
    { id: "D01", forme: "diamond", plein: true, valeur: getVal("diamond") },
    { id: "D02", forme: "diamond", plein: false, valeur: getVal("diamond") },
    
    // Croix et Plus
    { id: "P01", forme: "plus", plein: false, valeur: getVal("plus") },
    
    // Barres
    { id: "B01", forme: "bar", plein: true, valeur: getVal("bar") },
    { id: "B02", forme: "bar", plein: false, valeur: getVal("bar") }
];

module.exports = G;