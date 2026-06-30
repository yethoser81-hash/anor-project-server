/**
 * ============================================================
 * dessin_primitives.js
 * Toutes les primitives graphiques ANOR
 * ============================================================
 */

function primitiveRectangle(ctx,l,h){

    ctx.beginPath();

    ctx.rect(
        -l/2,
        -h/2,
        l,
        h
    );

}

function primitiveCarre(ctx,t){

    ctx.beginPath();

    ctx.rect(
        -t/2,
        -t/2,
        t,
        t
    );

}

function primitiveCercle(ctx,r){

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        r,
        0,
        Math.PI*2
    );

}

function primitiveTriangle(ctx,t){

    ctx.beginPath();

    ctx.moveTo(0,-t);

    ctx.lineTo(t,t);

    ctx.lineTo(-t,t);

    ctx.closePath();

}

function primitiveLosange(ctx,t){

    ctx.beginPath();

    ctx.moveTo(0,-t);

    ctx.lineTo(t,0);

    ctx.lineTo(0,t);

    ctx.lineTo(-t,0);

    ctx.closePath();

}

function primitiveCroix(ctx,t){

    ctx.beginPath();

    ctx.moveTo(-t,0);

    ctx.lineTo(t,0);

    ctx.moveTo(0,-t);

    ctx.lineTo(0,t);

}

function primitiveBarre(ctx,t){

    ctx.beginPath();

    ctx.rect(
        -t*.15,
        -t,
        t*.30,
        t*2
    );

}

function primitiveArc(ctx,r){

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        r,
        Math.PI*.15,
        Math.PI*1.85
    );

}

window.PRIMITIVES={

    rectangle:primitiveRectangle,

    carre:primitiveCarre,

    cercle:primitiveCercle,

    triangle:primitiveTriangle,

    losange:primitiveLosange,

    croix:primitiveCroix,

    barre:primitiveBarre,

    arc:primitiveArc

};