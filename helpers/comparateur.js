/**
 * helpers/comparateur.js
 * Moteur de comparaison unifié ANOR V11
 * Synchronisé avec les tolérances de comparateur_cryptogeometrique.py
 */

const TOLERANCE_ANGLE = 6;  // degrés
const TOLERANCE_RAYON = 12; // pixels

function comparerSignature(scan, reference) {
    if (!scan || !reference || scan.length === 0) return 0;
    
    let correspondances = 0;
    const total = reference.length;

    for (let i = 0; i < total; i++) {
        const a = scan[i];
        const b = reference[i];

        if (!a || !b) continue;

        // 1. Validation structurelle stricte (Anneau et Position)
        if (a.anneau !== b.anneau || a.position !== b.position) continue;

        // 2. Validation Forme et État (Plein/Vide)
        if (a.forme !== b.forme || a.plein !== b.plein) continue;

        // 3. Validation Géométrique (Tolérances identiques à Python)
        let diffAngle = Math.abs(a.angle - b.angle);
        if (diffAngle > 180) diffAngle = 360 - diffAngle; // Gestion du wrap-around 0/360
        
        const diffRayon = Math.abs(a.rayon - b.rayon);

        if (diffAngle <= TOLERANCE_ANGLE && diffRayon <= TOLERANCE_RAYON) {
            correspondances++;
        }
    }

    return Number(((correspondances / total) * 100).toFixed(2));
}

module.exports = { comparerSignature };