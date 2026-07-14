/**
 * ==========================================================
 * core/geometryIndex.js
 * ANOR V12
 * Construction d'un index géométrique normalisé
 * ==========================================================
 */

const crypto = require("crypto");

class GeometryIndex {

    /**
     * Construit un index géométrique stable
     */
    static build(glyphes = []) {

        if (!Array.isArray(glyphes))
            return null;

        const normalises = glyphes
            .map(g => ({

                anneau: Number(g.anneau),

                position: Number(g.position),

                forme: String(g.forme),

                plein: !!g.plein,

                angle: Math.round(Number(g.angle)),

                rayon: Math.round(Number(g.rayon))

            }))
            .sort((a, b) => {

                if (a.anneau !== b.anneau)
                    return a.anneau - b.anneau;

                return a.position - b.position;

            });

        const texte = JSON.stringify(normalises);

        const sha256 = crypto
            .createHash("sha256")
            .update(texte)
            .digest("hex");

        return {

    version: 2,

    sha256,

    prefix16: sha256.substring(0,16),

    prefix24: sha256.substring(0,24),

    nombreGlyphes: normalises.length,

    glyphes: normalises

};

    }

    /**
     * Vérifie deux index
     */
    static equals(indexA, indexB) {

        if (!indexA || !indexB)
            return false;

        return indexA.sha256 === indexB.sha256;

    }

}

module.exports = GeometryIndex;