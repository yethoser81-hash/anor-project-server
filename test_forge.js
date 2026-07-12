const ForgeRenderer = require("./public/forge/forgeRenderer.js"); // Adapte le chemin selon ta structure
const ForgeCore = require("./public/forge/forge_logic.js");

console.log("--- TEST DE SYNCHRONISATION ---");

// 1. Test de la logique
const testCle = "TEST_SERGES";
const instructions = ForgeCore.composer(testCle);
console.log(`[Logique] Succès : ${instructions.length} glyphes calculés pour la clé '${testCle}'.`);

// 2. Test du rendu
ForgeRenderer.renderSVG(testCle, null).then(svg => {
    if(svg.includes("<svg") && svg.length > 500) {
        console.log("[Rendu] Succès : Le SVG a été généré avec une taille de " + svg.length + " caractères.");
    } else {
        console.error("[Rendu] Erreur : Le SVG est invalide ou vide.");
    }
    console.log("--- TEST TERMINÉ ---");
}).catch(err => {
    console.error("[Erreur Critique] :", err);
});