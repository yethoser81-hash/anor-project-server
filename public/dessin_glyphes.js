/**
 * ============================================================
 * dessin_glyphes.js
 * Assemblage des glyphes ANOR
 * ============================================================
 */

function dessinerGlyphe(ctx,glyphe){

    const t=glyphe.taille;

    switch(glyphe.type){

        case 0:

            PRIMITIVES.rectangle(
                ctx,
                t*.55,
                t*1.80
            );

        break;

        case 1:

            PRIMITIVES.rectangle(
                ctx,
                t*.40,
                t*1.50
            );

            ctx.translate(
                t*.70,
                0
            );

            PRIMITIVES.rectangle(
                ctx,
                t*.40,
                t*1.50
            );

        break;

        case 2:

            PRIMITIVES.rectangle(
                ctx,
                t*.35,
                t*1.60
            );

            ctx.translate(
                t*.65,
                0
            );

            PRIMITIVES.rectangle(
                ctx,
                t*.35,
                t*1.20
            );

            ctx.translate(
                t*.65,
                0
            );

            PRIMITIVES.rectangle(
                ctx,
                t*.35,
                t*1.60
            );

        break;

        case 3:

            PRIMITIVES.cercle(
                ctx,
                t*.45
            );

            ctx.translate(
                t*.85,
                0
            );

            PRIMITIVES.rectangle(
                ctx,
                t*.30,
                t*1.20
            );

        break;

        case 4:

            PRIMITIVES.losange(
                ctx,
                t*.55
            );

            ctx.translate(
                t*.85,
                0
            );

            PRIMITIVES.rectangle(
                ctx,
                t*.35,
                t*1.40
            );

        break;

        case 5:

            PRIMITIVES.arc(
                ctx,
                t*.65
            );

            ctx.translate(
                t*.80,
                0
            );

            PRIMITIVES.rectangle(
                ctx,
                t*.35,
                t*1.40
            );

        break;

        case 6:

            PRIMITIVES.croix(
                ctx,
                t*.55
            );

            ctx.translate(
                t*.75,
                0
            );

            PRIMITIVES.cercle(
                ctx,
                t*.25
            );

        break;

        default:

            PRIMITIVES.rectangle(
                ctx,
                t*.40,
                t*1.40
            );

    }

}

window.dessinerGlyphe=dessinerGlyphe;