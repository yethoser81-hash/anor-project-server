/**
 * ============================================================
 * bibliotheque_glyphes.js
 * ANOR V4
 * ~100 glyphes (formes simples uniquement)
 * ============================================================
 */

const GLYPHES = (() => {

    const formes = [
        "rectangle",
        "carre",
        "cercle",
        "triangle",
        "losange",
        "croix",
        "barre_verticale"
    ];

    const base = [
        { x: 0, y: -10, taille: 18, rotation: 0, plein: true },
        { x: 0, y: 10, taille: 14, rotation: 0, plein: false },
        { x: -8, y: 0, taille: 16, rotation: -15, plein: true },
        { x: 8, y: 0, taille: 16, rotation: 15, plein: false }
    ];

    const glyphes = [];

    for (let i = 0; i < 100; i++) {

        const forme = formes[i % formes.length];

        const b = base[i % base.length];

        glyphes.push({
            nom: `G${String(i + 1).padStart(2, "0")}`,
            elements: [
                {
                    forme,
                    x: b.x + (i % 5),
                    y: b.y - (i % 7),
                    taille: b.taille + (i % 6),
                    rotation: (i * 7) % 360,
                    plein: (i % 2 === 0)
                },
                {
                    forme,
                    x: -b.x,
                    y: -b.y,
                    taille: Math.max(6, b.taille - (i % 5)),
                    rotation: (i * 11) % 360,
                    plein: (i % 3 !== 0)
                }
            ]
        });

    }

    return glyphes;

})();

module.exports = GLYPHES;