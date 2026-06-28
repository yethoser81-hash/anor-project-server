/**
 * ============================================================
 * forgeRenderer.js
 * LIVRAISON 2 / 1
 * Structure générale + primitives + anneaux
 * ============================================================
 */

const BLEU = "#336699";

const W = 1000;
const H = 1000;
const C = 500;

/*==========================================================
CANVAS
==========================================================*/

function getCtx(id){

    const canvas=document.getElementById(id);

    const ctx=canvas.getContext("2d");

    canvas.width=W;
    canvas.height=H;

    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality="high";

    ctx.lineCap="round";
    ctx.lineJoin="round";

    return ctx;

}

/*==========================================================
FOND
==========================================================*/

function dessinerFond(ctx){

    ctx.fillStyle="#ffffff";
    ctx.fillRect(0,0,W,H);

}

/*==========================================================
TEXTURE DETERMINISTE
==========================================================*/

function dessinerTexture(ctx,bibliotheque){

    let graine=0;

    bibliotheque.peripherie.forEach(e=>{

        graine+=e.rotation;

    });

    for(let i=0;i<900;i++){

        graine=(graine*9301+49297)%233280;

        const angle=(graine/233280)*Math.PI*2;

        graine=(graine*9301+49297)%233280;

        const rayon=180+(graine/233280)*280;

        const x=C+Math.cos(angle)*rayon;

        const y=C+Math.sin(angle)*rayon;

        ctx.beginPath();

        ctx.arc(x,y,.45,0,Math.PI*2);

        ctx.fillStyle="rgba(51,102,153,.05)";

        ctx.fill();

    }

}

/*==========================================================
CERCLE
==========================================================*/

function cercle(ctx,r,w){

    ctx.beginPath();

    ctx.arc(C,C,r,0,Math.PI*2);

    ctx.lineWidth=w;

    ctx.strokeStyle=BLEU;

    ctx.stroke();

}

/*==========================================================
ANNEAUX
==========================================================*/

function dessinerAnneaux(ctx){

    cercle(ctx,480,11);

    cercle(ctx,466,1);

    cercle(ctx,452,2);

    cercle(ctx,437,1);

    cercle(ctx,421,1);

    cercle(ctx,404,.8);

    cercle(ctx,388,.8);

    cercle(ctx,371,.8);

    cercle(ctx,354,.8);

    cercle(ctx,338,.8);

    cercle(ctx,320,.8);

    cercle(ctx,302,.8);

    cercle(ctx,284,.8);

    cercle(ctx,266,.8);

    cercle(ctx,248,.8);

}

/*==========================================================
POINTILLES
==========================================================*/

function dessinerPointilles(ctx){

    ctx.save();

    ctx.setLineDash([2,4]);

    ctx.beginPath();

    ctx.arc(C,C,372,0,Math.PI*2);

    ctx.lineWidth=.8;

    ctx.strokeStyle=BLEU;

    ctx.stroke();

    ctx.restore();

}

/*==========================================================
ROSETTE
==========================================================*/

function dessinerRosace(ctx){

    ctx.save();

    ctx.translate(C,C);

    ctx.strokeStyle=BLEU;

    ctx.lineWidth=.9;

    for(let i=0;i<96;i++){

        ctx.save();

        ctx.rotate(i*Math.PI*2/96);

        ctx.beginPath();

        ctx.moveTo(0,175);

        ctx.lineTo(0,212);

        ctx.stroke();

        ctx.restore();

    }

    ctx.restore();

}

/*==========================================================
GUILLOCHE
==========================================================*/

function dessinerGuilloche(ctx){

    ctx.beginPath();

    for(let a=0;a<=Math.PI*2+.003;a+=.0025){

        const r=

            458+

            Math.sin(a*21)*5+

            Math.cos(a*11)*2+

            Math.sin(a*53);

        const x=C+Math.cos(a)*r;

        const y=C+Math.sin(a)*r;

        if(a===0)

            ctx.moveTo(x,y);

        else

            ctx.lineTo(x,y);

    }

    ctx.strokeStyle=BLEU;

    ctx.lineWidth=1;

    ctx.stroke();

}

/*==========================================================
MICRO RAYONS
==========================================================*/

function dessinerRayons(ctx){

    ctx.strokeStyle="rgba(51,102,153,.10)";

    ctx.lineWidth=.35;

    for(let i=0;i<720;i++){

        const a=i*Math.PI*2/720;

        ctx.beginPath();

        ctx.moveTo(

            C+Math.cos(a)*210,

            C+Math.sin(a)*210

        );

        ctx.lineTo(

            C+Math.cos(a)*448,

            C+Math.sin(a)*448

        );

        ctx.stroke();

    }

}

/*==========================================================
COULEURS
==========================================================*/

function couleur(index){

    switch(index){

        case 0:

            return "#336699";

        case 1:

            return "#24507D";

        default:

            return "#5A92C8";

    }

}

/*==========================================================
FORMES
==========================================================*/

function dessinerPrimitive(ctx,item){

    const t=item.taille;

    ctx.beginPath();

    switch(item.forme){

        case "rectangle":

            ctx.rect(-t*.32,-t,t*.64,t*2);

        break;

        case "carre":

            ctx.rect(-t/2,-t/2,t,t);

        break;

        case "cercle":

            ctx.arc(0,0,t/2,0,Math.PI*2);

        break;

        case "triangle":

            ctx.moveTo(0,-t);

            ctx.lineTo(t,t);

            ctx.lineTo(-t,t);

            ctx.closePath();

        break;

        case "losange":

            ctx.moveTo(0,-t);

            ctx.lineTo(t,0);

            ctx.lineTo(0,t);

            ctx.lineTo(-t,0);

            ctx.closePath();

        break;

        case "croix":

            ctx.moveTo(-t,0);

            ctx.lineTo(t,0);

            ctx.moveTo(0,-t);

            ctx.lineTo(0,t);

        break;

        case "barre_verticale":

            ctx.rect(-t*.16,-t,t*.32,t*2);

        break;

        case "demi_cercle":

            ctx.arc(0,0,t,Math.PI,0);

        break;

    }

}
/*==========================================================
DESSIN D'UN ELEMENT CRYPTO
==========================================================*/

function dessinerElement(ctx,item,angle){

    const rayon=item.rayon+item.offset;

    const x=C+Math.cos(angle)*rayon;

    const y=C+Math.sin(angle)*rayon;

    ctx.save();

    ctx.translate(x,y);

    ctx.rotate(angle+item.rotation*Math.PI/180);

    ctx.strokeStyle=couleur(item.couleur);

    ctx.fillStyle=couleur(item.couleur);

    ctx.lineWidth=item.epaisseur;

    if(item.miroir){

        ctx.scale(-1,1);

    }

    dessinerPrimitive(ctx,item);

    if(item.plein){

        ctx.fill();

    }else{

        ctx.stroke();

    }

    ctx.restore();

}

/*==========================================================
ANNEAU CRYPTO
==========================================================*/

function dessinerAnneau(ctx,liste,decalage){

    const pas=Math.PI*2/liste.length;

    liste.forEach((item,index)=>{

        const angle=index*pas+decalage;

        dessinerElement(ctx,item,angle);

    });

}

/*==========================================================
ANNEAUX CRYPTOGRAPHIQUES
==========================================================*/

function dessinerBibliotheque(ctx,bibliotheque){

    dessinerAnneau(

        ctx,

        bibliotheque.noyau,

        0

    );

    dessinerAnneau(

        ctx,

        bibliotheque.transition,

        Math.PI/90

    );

    dessinerAnneau(

        ctx,

        bibliotheque.peripherie,

        Math.PI/60

    );

}

/*==========================================================
DOUBLE COURONNE CENTRALE
==========================================================*/

function dessinerCouronneLogo(ctx){

    ctx.beginPath();

    ctx.arc(C,C,214,0,Math.PI*2);

    ctx.lineWidth=3;

    ctx.strokeStyle=BLEU;

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(C,C,206,0,Math.PI*2);

    ctx.lineWidth=1;

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(C,C,198,0,Math.PI*2);

    ctx.lineWidth=.8;

    ctx.stroke();

}

/*==========================================================
LOGO
==========================================================*/

async function chargerLogo(ctx){

    dessinerCouronneLogo(ctx);

    const img=new Image();

    img.crossOrigin="anonymous";

    await new Promise(resolve=>{

        img.onload=resolve;

        img.onerror=resolve;

        img.src="/logo_anor_master.png";

    });

    if(img.complete && img.naturalWidth){

        ctx.drawImage(

            img,

            C-182,

            C-182,

            364,

            364

        );

    }else{

        ctx.fillStyle=BLEU;

        ctx.font="bold 84px Arial";

        ctx.textAlign="center";

        ctx.textBaseline="middle";

        ctx.fillText(

            "ANOR",

            C,

            C

        );

    }

}

/*==========================================================
PERLES EXTERNES
==========================================================*/

function dessinerPerles(ctx){

    ctx.fillStyle=BLEU;

    for(let i=0;i<360;i++){

        const a=i*Math.PI*2/360;

        ctx.beginPath();

        ctx.arc(

            C+Math.cos(a)*468,

            C+Math.sin(a)*468,

            .8,

            0,

            Math.PI*2

        );

        ctx.fill();

    }

}

/*==========================================================
MICRO PERLES INTERNES
==========================================================*/

function dessinerPerlesInternes(ctx){

    ctx.fillStyle="rgba(51,102,153,.35)";

    [235,280,325].forEach(r=>{

        for(let i=0;i<180;i++){

            const a=i*Math.PI*2/180;

            ctx.beginPath();

            ctx.arc(

                C+Math.cos(a)*r,

                C+Math.sin(a)*r,

                .5,

                0,

                Math.PI*2

            );

            ctx.fill();

        }

    });

}
/*==========================================================
FONCTIONS DE FINITION
==========================================================*/

function dessinerRepereNord(ctx){

    ctx.save();

    ctx.translate(C,C);

    ctx.strokeStyle=BLEU;

    ctx.lineWidth=2;

    for(let i=0;i<4;i++){

        ctx.save();

        ctx.rotate(i*Math.PI/2);

        ctx.beginPath();

        ctx.moveTo(0,-478);

        ctx.lineTo(0,-455);

        ctx.stroke();

        ctx.restore();

    }

    ctx.restore();

}

/*==========================================================
HALO
==========================================================*/

function dessinerHalo(ctx){

    const g=ctx.createRadialGradient(

        C,C,120,

        C,C,300

    );

    g.addColorStop(0,"rgba(255,255,255,0)");

    g.addColorStop(.55,"rgba(51,102,153,.05)");

    g.addColorStop(1,"rgba(255,255,255,0)");

    ctx.fillStyle=g;

    ctx.beginPath();

    ctx.arc(C,C,300,0,Math.PI*2);

    ctx.fill();

}

/*==========================================================
MICRO CERCLAGE
==========================================================*/

function dessinerMicroCercles(ctx){

    ctx.strokeStyle="rgba(51,102,153,.20)";

    ctx.lineWidth=.35;

    for(let r=250;r<440;r+=15){

        ctx.beginPath();

        ctx.arc(C,C,r,0,Math.PI*2);

        ctx.stroke();

    }

}

/*==========================================================
FINITIONS
==========================================================*/

function dessinerFinition(ctx){

    dessinerRepereNord(ctx);

    dessinerHalo(ctx);

    dessinerMicroCercles(ctx);

}

/*==========================================================
MOTEUR PRINCIPAL
==========================================================*/

async function dessinerSceauPremium(bibliotheque){

    const ctx=getCtx("sceauCanvas");

    ctx.clearRect(0,0,W,H);

    dessinerFond(ctx);

    dessinerTexture(ctx,bibliotheque);

    dessinerGuilloche(ctx);

    dessinerAnneaux(ctx);

    dessinerPointilles(ctx);

    dessinerRayons(ctx);

    dessinerRosace(ctx);

    dessinerPerles(ctx);

    dessinerPerlesInternes(ctx);

    dessinerBibliotheque(

        ctx,

        bibliotheque

    );

    await chargerLogo(ctx);

    /* Logo toujours au-dessus */

    ctx.globalCompositeOperation="source-over";

    dessinerFinition(ctx);

}

/*==========================================================
EXPORT
==========================================================*/

window.dessinerSceauPremium=

dessinerSceauPremium;