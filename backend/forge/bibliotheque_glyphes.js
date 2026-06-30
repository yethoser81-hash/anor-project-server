/**
 * ============================================================
 * bibliotheque_glyphes.js
 * ANOR V3
 * Bibliothèque officielle des glyphes.
 *
 * Chaque glyphe est composé de plusieurs primitives.
 * ============================================================
 */

const GLYPHES = [

/*==========================================================
G01
==========================================================*/

{
    nom: "G01",

    elements: [

        {
            forme: "rectangle",
            x: 0,
            y: -10,
            taille: 18,
            rotation: 0,
            plein: true
        },

        {
            forme: "rectangle",
            x: 0,
            y: 10,
            taille: 14,
            rotation: 0,
            plein: true
        }

    ]
},

/*==========================================================
G02
==========================================================*/

{
    nom: "G02",

    elements: [

        {
            forme: "cercle",
            x: 0,
            y: 0,
            taille: 12,
            rotation: 0,
            plein: false
        },

        {
            forme: "croix",
            x: 0,
            y: 0,
            taille: 8,
            rotation: 0,
            plein: false
        }

    ]
},

/*==========================================================
G03
==========================================================*/

{
    nom: "G03",

    elements: [

        {
            forme: "triangle",
            x: 0,
            y: -8,
            taille: 18,
            rotation: 0,
            plein: true
        },

        {
            forme: "losange",
            x: 0,
            y: 12,
            taille: 8,
            rotation: 45,
            plein: true
        }

    ]
},

/*==========================================================
G04
==========================================================*/

{
    nom: "G04",

    elements: [

        {
            forme: "rectangle",
            x: -8,
            y: 0,
            taille: 16,
            rotation: -18,
            plein: true
        },

        {
            forme: "rectangle",
            x: 8,
            y: 0,
            taille: 16,
            rotation: 18,
            plein: true
        }

    ]
},

/*==========================================================
G05
==========================================================*/

{
    nom: "G05",

    elements: [

        {
            forme: "barre_verticale",
            x: -6,
            y: 0,
            taille: 16,
            rotation: 0,
            plein: true
        },

        {
            forme: "barre_verticale",
            x: 6,
            y: 0,
            taille: 16,
            rotation: 0,
            plein: true
        },

        {
            forme: "cercle",
            x: 0,
            y: 0,
            taille: 6,
            rotation: 0,
            plein: true
        }

    ]
},

/*==========================================================
G06
==========================================================*/

{
    nom: "G06",

    elements: [

        {
            forme: "losange",
            x: 0,
            y: -10,
            taille: 10,
            rotation: 45,
            plein: false
        },

        {
            forme: "losange",
            x: 0,
            y: 10,
            taille: 10,
            rotation: 45,
            plein: true
        }

    ]
},

/*==========================================================
G07
==========================================================*/

{
    nom: "G07",

    elements: [

        {
            forme: "rectangle",
            x: -8,
            y: -8,
            taille: 10,
            rotation: 0,
            plein: true
        },

        {
            forme: "rectangle",
            x: 8,
            y: 8,
            taille: 10,
            rotation: 0,
            plein: false
        }

    ]
},

/*==========================================================
G08
==========================================================*/

{
    nom: "G08",

    elements: [

        {
            forme: "triangle",
            x: -6,
            y: 4,
            taille: 12,
            rotation: -15,
            plein: true
        },

        {
            forme: "triangle",
            x: 6,
            y: -4,
            taille: 8,
            rotation: 165,
            plein: false
        }

    ]
}

];

module.exports = GLYPHES;