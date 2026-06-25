/**
 * sceauEncoder.js - VERSION MISE À JOUR (COHÉRENTE BINAIRE)
 * Rôle : Forge l'empreinte géométrique unique en binaire pour chaque unité.
 * Correspondance exacte avec le moteur de rendu du Front-End et l'IA Constructeur.
 */

const crypto = require('crypto');

/**
 * Forge les vecteurs géométriques ajustés au format binaire :
 * Noyau (20 bits), Transition (30 bits), Périphérie (40 bits) = 90 bits au total.
 */
function genererVecteurs(data, secret, index) {
    // Création de l'empreinte HMAC source
    const brut = `${data.name}|${data.company}|${data.lot}|${data.origin}|${index}`;
    const hmac = crypto.createHmac("sha256", secret).update(brut).digest("hex");

    /**
     * Fonction pour extraire une séquence de taille n en bits
     * Utilise le modulo 2 sur les octets hexadécimaux pour garantir du binaire (0 ou 1)
     */
    const extraireSequence = (longueur, offset) => {
        let seq = "";
        for (let i = 0; i < longueur; i++) {
            // On parcourt les octets du HMAC
            const pos = (offset + i) % 32;
            const byte = parseInt(hmac.substr(pos * 2, 2), 16);
            
            // Conversion en bit (0 ou 1)
            seq += (byte % 2).toString();
        }
        return seq;
    };

    return {
        noyau: extraireSequence(20, 0),       // 20 bits
        transition: extraireSequence(30, 20), // 30 bits
        peripherie: extraireSequence(40, 50)  // 40 bits
    };
}

/**
 * [AJOUT] Helper pour synchronisation front-end : 
 * Garantit que la forme géométrique correspond au bit lu et au SEED.
 */
function getFormeParBit(index, bit) {
    const SEED = 3;
    const bibliotheque = ["cercle", "carre", "rectangle", "triangle", "losange", "croix", "demi_cercle", "barre_verticale"];
    return bibliotheque[(index + parseInt(bit) + SEED) % 8];
}

/**
 * Fonction appelée pour générer le sceau d'une unité spécifique.
 */
function creerSceau(data, secret, index) {
    const vecteurs = genererVecteurs(data, secret, index);
    return {
        uid: crypto.randomUUID(),
        index: index,
        // Concaténation pour faciliter l'envoi vers l'IA si nécessaire
        signature_complete: vecteurs.noyau + vecteurs.transition + vecteurs.peripherie,
        ...vecteurs
    };
}

module.exports = { creerSceau, getFormeParBit };