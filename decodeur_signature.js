/**
 * ==========================================================
 * decodeur_signature.js
 * ANOR V7 - LIVRAISON 3
 * HARDENING FINAL / PRODUCTION LOCK / ANTI-FUZZ MATCH
 * ==========================================================
 */

const crypto = require("crypto");
const iaConstructeur = require("./ia_constructeur");
const vision = require("./vision_client");

const BIT_LENGTH = 90;

const ZONES = Object.freeze({
    NOYAU: [0, 20],
    TRANSITION: [20, 50],
    PERIPHERIE: [50, 90]
});


/**
 * ==========================================================
 * NORMALISATION STRICTE (ANTI VARIANCE INPUT)
 * ==========================================================
 */

function normalizeBits(bits) {
    if (typeof bits !== "string") return "";
    return bits.replace(/[^01]/g, "").slice(0, BIT_LENGTH);
}


/**
 * ==========================================================
 * 1. SIGNATURE
 * ==========================================================
 */

function genererSignature(
    nomProduit,
    nomProducteur,
    lot,
    paysOrigine,
    nonce,
    secret
) {
    const payload = `${nomProduit}|${nomProducteur}|${lot}|${paysOrigine}|${nonce}`;

    const hash = crypto
        .createHmac("sha256", secret)
        .update(payload, "utf8")
        .digest();

    let bits = "";
    for (let i = 0; i < hash.length; i++) {
        bits += hash[i].toString(2).padStart(8, "0");
    }

    return bits.slice(0, BIT_LENGTH);
}


/**
 * ==========================================================
 * 2. BITS → GLYPHES
 * ==========================================================
 */

function slice(bits, start, end) {
    return bits.slice(start, end);
}

function bitsVersBibliotheque(signature) {
    const bits = normalizeBits(signature);

    if (bits.length < BIT_LENGTH) {
        throw new Error("Signature invalide (90 bits requis)");
    }

    return {
        noyau: iaConstructeur.construireSequence(slice(bits, ...ZONES.NOYAU)),
        transition: iaConstructeur.construireSequence(slice(bits, ...ZONES.TRANSITION)),
        peripherie: iaConstructeur.construireSequence(slice(bits, ...ZONES.PERIPHERIE))
    };
}


/**
 * ==========================================================
 * 3. SEAL ID
 * ==========================================================
 */

function genererSealId(signature) {
    return crypto
        .createHash("sha256")
        .update(signature, "utf8")
        .digest("hex");
}


/**
 * ==========================================================
 * 4. HAMMING ROBUSTE (PENALISATION FORTE)
 * ==========================================================
 */

function hamming(a, b) {
    const A = normalizeBits(a);
    const B = normalizeBits(b);

    if (!A || !B) return BIT_LENGTH;

    const len = Math.min(A.length, B.length);

    let d = Math.abs(A.length - B.length);

    for (let i = 0; i < len; i++) {
        if (A[i] !== B[i]) d++;
    }

    return d;
}


/**
 * ==========================================================
 * 5. SCORE GLYPHES (STRICT + DÉTERMINISTE)
 * ==========================================================
 */

function scoreGlyphes(ia, db) {
    if (!ia || !db) return 0;

    let total = 0;
    let ok = 0;

    const zones = ["noyau", "transition", "peripherie"];

    for (const zone of zones) {
        const A = ia[zone] || [];
        const B = db[zone] || [];

        const len = Math.min(A.length, B.length);

        for (let i = 0; i < len; i++) {
            total++;

            if (A[i]?.nom === B[i]?.nom) {
                ok++;
            }
        }
    }

    return total ? (ok / total) * 100 : 0;
}


/**
 * ==========================================================
 * 6. SCORE FINAL (VERROUILLÉ)
 * ==========================================================
 */

function scoreFinal(bitsScore, glyphScore) {
    const s = (bitsScore * 0.75) + (glyphScore * 0.25);
    return Math.max(0, Math.min(100, s));
}


/**
 * ==========================================================
 * 7. COMPARAISON PRINCIPALE (PIPELINE IMMUTABLE)
 * ==========================================================
 */

function comparerSceau(resultatIA, produits) {
    if (!resultatIA || !Array.isArray(produits)) return null;

    let best = null;
    let bestScore = -1;

    for (const p of produits) {
        try {
            const dbBits = normalizeBits(p.code_sceau || "");

            const bitsScore = (
                90 -
                (
                    hamming(resultatIA.noyau, dbBits.slice(...ZONES.NOYAU)) +
                    hamming(resultatIA.transition, dbBits.slice(...ZONES.TRANSITION)) +
                    hamming(resultatIA.peripherie, dbBits.slice(...ZONES.PERIPHERIE))
                )
            ) / 90 * 100;

            let dbGlyphes = null;

            if (p.bibliotheque_formes) {
                dbGlyphes = typeof p.bibliotheque_formes === "string"
                    ? JSON.parse(p.bibliotheque_formes)
                    : p.bibliotheque_formes;
            }

            const glyphScore = scoreGlyphes(resultatIA.glyphes, dbGlyphes);

            const finalScore = scoreFinal(bitsScore, glyphScore);

            if (finalScore > bestScore) {
                bestScore = finalScore;
                best = {
                    produit: p,
                    score: Number(finalScore.toFixed(2)),
                    bits: Number(bitsScore.toFixed(2)),
                    glyphes: Number(glyphScore.toFixed(2))
                };
            }

        } catch (_) {
            continue;
        }
    }

    return best;
}

/**
 * ==========================================================
 * 8. ANALYSE IA (VISION)
 * ==========================================================
 */

async function analyserDepuisImage(path, produits) {
    const resultatIA = await vision.analyserImage(path);
    return comparerSceau(resultatIA, produits);
}


/**
 * ==========================================================
 * EXPORTS
 * ==========================================================
 */

module.exports = {
    genererSignature,
    bitsVersBibliotheque,
    genererSealId,
    comparerSceau,
    analyserDepuisImage
};