/**
 * ==========================================================
 * core/geometryMatcher.js
 * ANOR V15
 * Moteur de similarité géométrique
 * ==========================================================
 */

class GeometryMatcher {

    constructor() {

        this.POIDS = {
            forme: 35,
            plein: 15,
            position: 20,
            angle: 15,
            rayon: 15
        };

        this.TOLERANCE_ANGLE = 6;
        this.TOLERANCE_RAYON = 10;

    }

    comparer(scan, reference) {

        if (!scan.length || !reference.length) {

            return {
                score: 0,
                correspondances: 0
            };

        }

        let total = 0;
        let matches = 0;

        for (const ref of reference) {

            const lu = scan.find(g =>
                g.anneau === ref.anneau &&
                g.position === ref.position
            );

            if (!lu)
                continue;

            matches++;

            total += this.scoreGlyphe(lu, ref);

        }

        const score =
            total / reference.length;

        return {

            score: Number(score.toFixed(2)),

            correspondances: matches

        };

    }

    scoreGlyphe(a, b) {

        let s = 0;

        if (a.forme === b.forme)
            s += this.POIDS.forme;

        if (a.plein === b.plein)
            s += this.POIDS.plein;

        if (a.position === b.position)
            s += this.POIDS.position;

        if (
            Math.abs(a.angle - b.angle)
            <= this.TOLERANCE_ANGLE
        ) {
            s += this.POIDS.angle;
        }

        if (
            Math.abs(a.rayon - b.rayon)
            <= this.TOLERANCE_RAYON
        ) {
            s += this.POIDS.rayon;
        }

        return s;

    }

}

module.exports = GeometryMatcher;