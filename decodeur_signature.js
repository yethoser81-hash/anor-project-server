/**
 * decodeur_signature.js - ANOR V7
 * Moteur unifié : Forge et Décodage.
 */
const crypto = require("crypto");
const G = require("../public/forge/dessin_glyphes");

const BIT_LENGTH = 90;
const ZONES = Object.freeze({ NOYAU: [0, 20], TRANSITION: [20, 50], PERIPHERIE: [50, 90] });

function genererSignature(nomProduit, nomProducteur, lot, paysOrigine, nonce, secret) {
    const payload = `${nomProduit}|${nomProducteur}|${lot}|${paysOrigine}|${nonce}`;
    const hash = crypto.createHmac("sha256", secret).update(payload, "utf8").digest();
    let bits = "";
    for (let i = 0; i < 12; i++) { // 12 octets = 96 bits
        bits += hash[i].toString(2).padStart(8, "0");
    }
    return bits.slice(0, BIT_LENGTH);
}

function bitsVersBibliotheque(signature) {
    const bits = signature.slice(0, BIT_LENGTH);
    const chunk = (str, size) => str.match(new RegExp('.{1,' + size + '}', 'g')) || [];
    
    return {
        noyau: chunk(bits.substring(...ZONES.NOYAU), 5).map(b => G[parseInt(b, 2) % G.length]),
        transition: chunk(bits.substring(...ZONES.TRANSITION), 5).map(b => G[parseInt(b, 2) % G.length]),
        peripherie: chunk(bits.substring(...ZONES.PERIPHERIE), 5).map(b => G[parseInt(b, 2) % G.length])
    };
}

module.exports = { genererSignature, bitsVersBibliotheque };