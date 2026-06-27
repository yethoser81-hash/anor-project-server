/**
 * forgeRenderer.js
 * Moteur de rendu premium ANOR - VERSION UNIFIÉE & OPTIMISÉE
 * -------------------------------------------------------------
 * Intégration : Qualité Haute Définition + Lisibilité des formes
 */

const BLEU_ANOR = "#336699";

/* ===============================
   OUTIL : CANVAS CONTEXT SAFE
================================ */
function getCtx(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    canvas.width = 1000;
    canvas.height = 1000;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high"; // Optimisation 1 : Qualité maximale
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    return ctx;
}

/* ===============================
   DESSIN DE FORME UNIFIÉ
================================ */
function dessinerForme(ctx, forme, taille) {
    switch(forme) {
        case "cercle": ctx.arc(0, 0, taille / 2, 0, Math.PI * 2); break;
        case "carre": ctx.rect(-taille/2, -taille/2, taille, taille); break;
        case "rectangle": ctx.rect(-taille, -taille/3, taille*2, taille/1.5); break;
        case "triangle":
            ctx.moveTo(0, -taille);
            ctx.lineTo(taille, taille);
            ctx.lineTo(-taille, taille);
            ctx.closePath();
            break;
        case "losange":
            ctx.moveTo(0, -taille);
            ctx.lineTo(taille, 0);
            ctx.lineTo(0, taille);
            ctx.lineTo(-taille, 0);
            ctx.closePath();
            break;
        case "croix":
            ctx.moveTo(-taille, 0); ctx.lineTo(taille, 0);
            ctx.moveTo(0, -taille); ctx.lineTo(0, taille);
            break;
        case "demi_cercle": ctx.arc(0, 0, taille, Math.PI, 2 * Math.PI); break;
        case "barre_verticale": ctx.rect(-taille/4, -taille, taille/2, taille*2); break;
    }
}

/* ===============================
   FOND GRAVÉ (SECURITY TEXTURE)
================================ */
function dessinerFondGrave(ctx, centre) {
    for (let i = 0; i < 520; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 200 + Math.random() * 250;
        const x = centre + Math.cos(angle) * r;
        const y = centre + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(51,102,153,0.06)";
        ctx.fill();
    }
}

/* ===============================
   GUILLOCHES PRINCIPALES
================================ */
function dessinerGuilloche(ctx, centre) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.01) {
        const r = 455 + Math.sin(a * 18) * 5 + Math.sin(a * 47) * 2;
        const x = centre + Math.cos(a) * r;
        const y = centre + Math.sin(a) * r;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = BLEU_ANOR;
    ctx.lineWidth = 1.2;
    ctx.stroke();
}

/* ===============================
   ROSACE CENTRALE
================================ */
function dessinerRosace(ctx, centre) {
    ctx.lineWidth = 1;
    for (let i = 0; i < 42; i++) {
        const angle = (i / 42) * Math.PI * 2;
        ctx.save();
        ctx.translate(centre, centre);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 180);
        ctx.lineTo(0, 215);
        ctx.strokeStyle = BLEU_ANOR;
        ctx.stroke();
        ctx.restore();
    }
}

/* ===============================
   LOGO CENTRAL SAFE LOAD
================================ */
async function chargerLogo(ctx, centre, size) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = "/logo_anor_master.png";
    });
    if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, centre - size, centre - size, size * 2, size * 2);
    } else {
        ctx.fillStyle = BLEU_ANOR;
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("ANOR", centre, centre + 25);
    }
}

/* ===============================
   OVERLAY CIRCLES
================================ */
function dessinerCerclesBase(ctx, centre) {
    ctx.strokeStyle = BLEU_ANOR;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centre, centre, 480, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centre, centre, 450, 0, Math.PI * 2);
    ctx.stroke();
}

/* ===============================
   ANNEAUX CRYPTOGRAPHIQUES (LIVRAISON 2)
================================ */
function dessinerAnneauxCryptographiques(ctx, centre, bibliotheque) {
    const anneaux = [
        { data: bibliotheque.noyau, rayon: 235, size: 10, decalage: 0 },
        { data: bibliotheque.transition, rayon: 325, size: 17, decalage: 0.03 },
        { data: bibliotheque.peripherie, rayon: 425, size: 27, decalage: 0.08 }
    ];

    anneaux.forEach((anneau) => {
        const total = anneau.data.length;
        for (let i = 0; i < total; i++) {
            const item = anneau.data[i];
            const angle = (i / total) * Math.PI * 2 + anneau.decalage;
            const x = centre + Math.cos(angle) * anneau.rayon;
            const y = centre + Math.sin(angle) * anneau.rayon;

            let taille = anneau.size;
            if (item.forme === "triangle") taille *= 1.5;
            if (item.forme === "croix") taille *= 1.3;
            if (item.forme === "cercle") taille *= 0.9;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.sin(i * 3.17) * 0.2);

            // Optimisation 2 : Nettoyage ombre et contour blanc
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            ctx.beginPath();
            dessinerForme(ctx, item.forme, taille);

            if (i % 3 === 0) {
                ctx.fillStyle = "#2d5d91";
                ctx.fill();
                ctx.lineWidth = 2; // Contour blanc
                ctx.strokeStyle = "#FFFFFF";
                ctx.stroke();
            } else if (i % 3 === 1) {
                ctx.strokeStyle = "#336699";
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = "#5c90c8";
                ctx.fill();
                ctx.lineWidth = 2; // Contour blanc
                ctx.strokeStyle = "#FFFFFF";
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }
    });
}

/* ===============================
   MAIN ENTRY POINT
================================ */
async function dessinerSceauPremium(bibliotheque) {
    const ctx = getCtx("sceauCanvas");
    const centre = 500;

    ctx.clearRect(0, 0, 1000, 1000);

    dessinerFondGrave(ctx, centre);
    dessinerGuilloche(ctx, centre);
    dessinerCerclesBase(ctx, centre);
    dessinerRosace(ctx, centre);
    
    await chargerLogo(ctx, centre, 210);

    dessinerAnneauxCryptographiques(ctx, centre, bibliotheque);
}

window.dessinerSceauPremium = dessinerSceauPremium;
/* ============================================================
   LIVRAISON 3
   ROSACES + GUILLOCHES + FOND DÉTERMINISTE
   À AJOUTER DANS forgeRenderer.js
============================================================ */


/*============================================================
ROSACE CRYPTOGRAPHIQUE
============================================================*/

function dessinerRosaceCryptographique(ctx, centre){

    ctx.save();

    ctx.translate(centre,centre);

    ctx.beginPath();

    for(let a=0;a<=Math.PI*2+0.01;a+=0.003){

        const r=
            150
            +
            Math.sin(a*16)*22
            +
            Math.sin(a*48)*7;

        const x=Math.cos(a)*r;
        const y=Math.sin(a)*r;

        if(a===0)
            ctx.moveTo(x,y);
        else
            ctx.lineTo(x,y);

    }

    ctx.strokeStyle="#336699";
    ctx.lineWidth=1.3;
    ctx.stroke();

    ctx.restore();

}


/*============================================================
DOUBLE GUILLOCHE BANCAIRE
============================================================*/

function dessinerGuillocheSecondaire(ctx,centre){

    ctx.beginPath();

    for(let a=0;a<=Math.PI*2+0.01;a+=0.004){

        const r=
            395
            +
            Math.sin(a*37)*5
            +
            Math.sin(a*83)*2;

        const x=
            centre+
            Math.cos(a)*r;

        const y=
            centre+
            Math.sin(a)*r;

        if(a===0)
            ctx.moveTo(x,y);
        else
            ctx.lineTo(x,y);

    }

    ctx.strokeStyle="#336699";
    ctx.lineWidth=.8;
    ctx.stroke();

}


/*============================================================
MICRO LIGNES RADIALES
============================================================*/

function dessinerMicroRayons(ctx,centre){

    ctx.strokeStyle="rgba(51,102,153,.12)";
    ctx.lineWidth=.5;

    for(let i=0;i<720;i++){

        const a=i*Math.PI*2/720;

        ctx.beginPath();

        ctx.moveTo(

            centre+
            Math.cos(a)*205,

            centre+
            Math.sin(a)*205

        );

        ctx.lineTo(

            centre+
            Math.cos(a)*445,

            centre+
            Math.sin(a)*445

        );

        ctx.stroke();

    }

}


/*============================================================
FOND SECURISE DETERMINISTE
============================================================*/

function dessinerFondDeterministe(ctx,centre){

    for(let i=0;i<700;i++){

        const angle=(i*137.507764)%360;

        const a=angle*Math.PI/180;

        const r=

            210+

            ((i*73)%220);

        const x=

            centre+

            Math.cos(a)*r;

        const y=

            centre+

            Math.sin(a)*r;

        ctx.beginPath();

        ctx.arc(x,y,.45,0,Math.PI*2);

        ctx.fillStyle="rgba(51,102,153,.05)";

        ctx.fill();

    }

}


/*============================================================
REMPLACER LE MAIN
============================================================*/


async function dessinerSceauPremium(bibliotheque){

    const ctx=getCtx("sceauCanvas");

    const centre=500;

    ctx.clearRect(0,0,1000,1000);

    dessinerFondDeterministe(ctx,centre);

    dessinerFondGrave(ctx,centre);

    dessinerGuilloche(ctx,centre);

    dessinerGuillocheSecondaire(ctx,centre);

    dessinerCerclesBase(ctx,centre);

    dessinerMicroRayons(ctx,centre);

    dessinerRosace(ctx,centre);

    dessinerRosaceCryptographique(ctx,centre);

    await chargerLogo(ctx,centre,210);

    dessinerAnneauxCryptographiques(ctx,centre,bibliotheque);

}

window.dessinerSceauPremium=dessinerSceauPremium;

/*============================================================
LIVRAISON 4
ANTI-CONTREFAÇON VISUELLE
À AJOUTER DANS forgeRenderer.js
============================================================*/


/*============================================================
MICRO PERLES
============================================================*/

function dessinerMicroPerles(ctx,centre){

    for(let i=0;i<360;i++){

        const a=i*Math.PI*2/360;

        const r=468;

        const x=
            centre+
            Math.cos(a)*r;

        const y=
            centre+
            Math.sin(a)*r;

        ctx.beginPath();

        ctx.arc(x,y,0.9,0,Math.PI*2);

        ctx.fillStyle="#336699";

        ctx.fill();

    }

}


/*============================================================
MICRO CROIX
============================================================*/

function dessinerMicroCroix(ctx,centre){

    ctx.strokeStyle="rgba(51,102,153,.18)";
    ctx.lineWidth=.4;

    for(let i=0;i<180;i++){

        const a=i*Math.PI*2/180;

        const r=275;

        const x=
            centre+
            Math.cos(a)*r;

        const y=
            centre+
            Math.sin(a)*r;

        ctx.beginPath();

        ctx.moveTo(x-2,y);
        ctx.lineTo(x+2,y);

        ctx.moveTo(x,y-2);
        ctx.lineTo(x,y+2);

        ctx.stroke();

    }

}


/*============================================================
ANNEAU POINTILLÉ
============================================================*/

function dessinerAnneauPointille(ctx,centre){

    ctx.save();

    ctx.setLineDash([2,5]);

    ctx.beginPath();

    ctx.arc(centre,centre,372,0,Math.PI*2);

    ctx.strokeStyle="#336699";
    ctx.lineWidth=1;

    ctx.stroke();

    ctx.restore();

}


/*============================================================
MICRO TRIANGLES
============================================================*/

function dessinerTrianglesSecurite(ctx,centre){

    ctx.fillStyle="rgba(51,102,153,.28)";

    for(let i=0;i<90;i++){

        const a=i*Math.PI*2/90;

        const r=350;

        const x=
            centre+
            Math.cos(a)*r;

        const y=
            centre+
            Math.sin(a)*r;

        ctx.save();

        ctx.translate(x,y);

        ctx.rotate(a);

        ctx.beginPath();

        ctx.moveTo(0,-3);

        ctx.lineTo(2.6,3);

        ctx.lineTo(-2.6,3);

        ctx.closePath();

        ctx.fill();

        ctx.restore();

    }

}


/*============================================================
HALO CENTRAL
============================================================*/

function dessinerHalo(ctx,centre){

    const g=

        ctx.createRadialGradient(

            centre,
            centre,
            80,

            centre,
            centre,
            270

        );

    g.addColorStop(0,"rgba(51,102,153,.10)");
    g.addColorStop(.5,"rgba(51,102,153,.03)");
    g.addColorStop(1,"rgba(51,102,153,0)");

    ctx.fillStyle=g;

    ctx.beginPath();

    ctx.arc(

        centre,
        centre,
        270,
        0,
        Math.PI*2

    );

    ctx.fill();

}


/*============================================================
REMPLACER LE MAIN
============================================================*/


async function dessinerSceauPremium(bibliotheque){

    const ctx=getCtx("sceauCanvas");

    const centre=500;

    ctx.clearRect(0,0,1000,1000);

    dessinerFondDeterministe(ctx,centre);

    dessinerFondGrave(ctx,centre);

    dessinerHalo(ctx,centre);

    dessinerGuilloche(ctx,centre);

    dessinerGuillocheSecondaire(ctx,centre);

    dessinerCerclesBase(ctx,centre);

    dessinerAnneauPointille(ctx,centre);

    dessinerMicroRayons(ctx,centre);

    dessinerMicroCroix(ctx,centre);

    dessinerTrianglesSecurite(ctx,centre);

    dessinerMicroPerles(ctx,centre);

    dessinerRosace(ctx,centre);

    dessinerRosaceCryptographique(ctx,centre);

    await chargerLogo(ctx,centre,210);

    dessinerAnneauxCryptographiques(ctx,centre,bibliotheque);

}

window.dessinerSceauPremium=dessinerSceauPremium;

/* ============================================================
   LIVRAISON 5
   MICRO-TEXTES + GUILLOCHES INTERNES + REPÈRES
============================================================ */

function dessinerMicroTexte(ctx, centre){

    ctx.save();

    ctx.translate(centre,centre);

    ctx.font="12px Arial";
    ctx.fillStyle="rgba(51,102,153,.35)";
    ctx.textAlign="center";
    ctx.textBaseline="middle";

    const texte="ANOR • CERTIFICATION • OFFICIELLE • ";

    for(let i=0;i<180;i++){

        const angle=i*2*Math.PI/180;

        ctx.save();

        ctx.rotate(angle);

        ctx.translate(0,-385);

        ctx.rotate(Math.PI/2);

        ctx.fillText(texte,0,0);

        ctx.restore();

    }

    ctx.restore();

}

function dessinerGuillocheInterne(ctx,centre){

    ctx.beginPath();

    for(let a=0;a<=Math.PI*2+0.01;a+=0.005){

        const r=
            305
            +
            Math.sin(a*16)*8
            +
            Math.sin(a*43)*3
            +
            Math.cos(a*7)*2;

        const x=centre+Math.cos(a)*r;
        const y=centre+Math.sin(a)*r;

        if(a===0)
            ctx.moveTo(x,y);
        else
            ctx.lineTo(x,y);

    }

    ctx.strokeStyle="rgba(51,102,153,.45)";
    ctx.lineWidth=0.8;
    ctx.stroke();

}

function dessinerRepereCardinaux(ctx,centre){

    ctx.save();

    ctx.strokeStyle="#336699";
    ctx.lineWidth=2;

    for(let i=0;i<4;i++){

        ctx.save();

        ctx.translate(centre,centre);

        ctx.rotate(i*Math.PI/2);

        ctx.beginPath();
        ctx.moveTo(0,-475);
        ctx.lineTo(0,-455);
        ctx.stroke();

        ctx.restore();

    }

    ctx.restore();

}/* ============================================================
   LIVRAISON 6
   FILIGRANE CENTRAL + HALO + FINALISATION
============================================================ */

function dessinerFiligrane(ctx,centre){

    ctx.save();

    ctx.translate(centre,centre);

    ctx.globalAlpha=.05;

    ctx.strokeStyle="#336699";
    ctx.lineWidth=14;

    for(let i=0;i<24;i++){

        ctx.rotate(Math.PI/12);

        ctx.beginPath();

        ctx.moveTo(0,0);
        ctx.lineTo(0,-185);

        ctx.stroke();

    }

    ctx.restore();

    ctx.globalAlpha=1;

}

function dessinerHaloCentral(ctx,centre){

    const g=ctx.createRadialGradient(
        centre,
        centre,
        120,
        centre,
        centre,
        260
    );

    g.addColorStop(0,"rgba(255,255,255,0)");
    g.addColorStop(.55,"rgba(255,255,255,.12)");
    g.addColorStop(1,"rgba(255,255,255,0)");

    ctx.fillStyle=g;

    ctx.beginPath();
    ctx.arc(centre,centre,260,0,Math.PI*2);
    ctx.fill();

}

function dessinerFinition(ctx,centre){

    ctx.strokeStyle="#336699";
    ctx.lineWidth=0.6;

    for(let r=240;r<=430;r+=18){

        ctx.beginPath();
        ctx.arc(centre,centre,r,0,Math.PI*2);
        ctx.stroke();

    }

}