/**
 * ============================================================
 * dessin_primitives.js
 * ANOR V7
 * Bibliothèque unique des primitives géométriques
 * ============================================================
 */

const PRIMITIVES = {};

/*==========================================================
UTILITAIRE
==========================================================*/

function begin(ctx, rotation = 0) {
    ctx.save();
    if (rotation !== 0) {
        ctx.rotate(rotation * Math.PI / 180);
    }
    ctx.beginPath();
}

function end(ctx, plein) {
    if (plein) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
    ctx.restore();
}

/*==========================================================
CERCLE
==========================================================*/

PRIMITIVES.cercle = function (
    ctx,
    taille,
    plein = false,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.arc(
        0,
        0,
        taille * 0.5,
        0,
        Math.PI * 2
    );

    end(ctx, plein);

};

/*==========================================================
CARRÉ
==========================================================*/

PRIMITIVES.carre = function (
    ctx,
    taille,
    plein = false,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.rect(
        -taille / 2,
        -taille / 2,
        taille,
        taille
    );

    end(ctx, plein);

};

/*==========================================================
RECTANGLE
==========================================================*/

PRIMITIVES.rectangle = function (
    ctx,
    largeur,
    hauteur,
    plein = false,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.rect(
        -largeur / 2,
        -hauteur / 2,
        largeur,
        hauteur
    );

    end(ctx, plein);

};

/*==========================================================
TRIANGLE
==========================================================*/

PRIMITIVES.triangle = function (
    ctx,
    taille,
    plein = false,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.moveTo(
        0,
        -taille
    );

    ctx.lineTo(
        taille,
        taille
    );

    ctx.lineTo(
        -taille,
        taille
    );

    ctx.closePath();

    end(ctx, plein);

};

/*==========================================================
LOSANGE
==========================================================*/

PRIMITIVES.losange = function (
    ctx,
    taille,
    plein = false,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.moveTo(
        0,
        -taille
    );

    ctx.lineTo(
        taille,
        0
    );

    ctx.lineTo(
        0,
        taille
    );

    ctx.lineTo(
        -taille,
        0
    );

    ctx.closePath();

    end(ctx, plein);

};

/*==========================================================
CROIX
==========================================================*/

PRIMITIVES.croix = function (
    ctx,
    taille,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.moveTo(
        -taille,
        0
    );

    ctx.lineTo(
        taille,
        0
    );

    ctx.moveTo(
        0,
        -taille
    );

    ctx.lineTo(
        0,
        taille
    );

    end(ctx, false);

};

/*==========================================================
BARRE VERTICALE
==========================================================*/

PRIMITIVES.barre = function (
    ctx,
    hauteur,
    epaisseur,
    plein = false,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.rect(
        -epaisseur / 2,
        -hauteur / 2,
        epaisseur,
        hauteur
    );

    end(ctx, plein);

};

/*==========================================================
ARC
==========================================================*/

PRIMITIVES.arc = function (
    ctx,
    rayon,
    ouverture = 120,
    rotation = 0
) {

    begin(ctx, rotation);

    const a = ouverture * Math.PI / 180;

    ctx.arc(
        0,
        0,
        rayon,
        -a / 2,
        a / 2
    );

    end(ctx, false);

};

/*==========================================================
DEMI CERCLE
==========================================================*/

PRIMITIVES.demiCercle = function (
    ctx,
    rayon,
    plein = false,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.arc(
        0,
        0,
        rayon,
        Math.PI,
        0
    );

    ctx.lineTo(
        rayon,
        0
    );

    ctx.lineTo(
        -rayon,
        0
    );

    ctx.closePath();

    end(ctx, plein);

};

/*==========================================================
POINT
==========================================================*/

PRIMITIVES.point = function (
    ctx,
    rayon = 2
) {

    begin(ctx);

    ctx.arc(
        0,
        0,
        rayon,
        0,
        Math.PI * 2
    );

    end(ctx, true);

};

/*==========================================================
DOUBLE CERCLE
==========================================================*/

PRIMITIVES.doubleCercle = function (
    ctx,
    rayon
) {

    begin(ctx);

    ctx.arc(
        0,
        0,
        rayon,
        0,
        Math.PI * 2
    );

    ctx.moveTo(
        rayon * 0.55,
        0
    );

    ctx.arc(
        0,
        0,
        rayon * 0.55,
        0,
        Math.PI * 2
    );

    end(ctx, false);

};

/*==========================================================
ANNEAU
==========================================================*/

PRIMITIVES.anneau = function (
    ctx,
    rayon
) {

    begin(ctx);

    ctx.arc(
        0,
        0,
        rayon,
        0,
        Math.PI * 2
    );

    ctx.moveTo(
        rayon * 0.60,
        0
    );

    ctx.arc(
        0,
        0,
        rayon * 0.60,
        0,
        Math.PI * 2,
        true
    );

    end(ctx, false);

};

/*==========================================================
CHEVRON
==========================================================*/

PRIMITIVES.chevron = function (
    ctx,
    taille,
    rotation = 0
) {

    begin(ctx, rotation);

    ctx.moveTo(
        -taille,
        -taille * 0.5
    );

    ctx.lineTo(
        0,
        taille
    );

    ctx.lineTo(
        taille,
        -taille * 0.5
    );

    end(ctx, false);

};

/*==========================================================
EXPORT
==========================================================*/

window.PRIMITIVES = PRIMITIVES;