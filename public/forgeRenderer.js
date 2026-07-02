/**
 * ============================================================
 * forgeRenderer.js
 * ANOR V4 - VERSION SOUVERAINE
 * ============================================================
 */

const BLEU = "#336699";
const W = 1000;
const H = 1000;
const C = 500;

function getCtx(id){
    const canvas = document.getElementById(id);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
}

/*==========================================================
FOND
==========================================================*/
function dessinerFond(ctx){
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
}

/*==========================================================
COULEURS
==========================================================*/
function couleur(index){
    switch(index){
        case 0: return "#336699";
        case 1: return "#1F4F88";
        case 2: return "#4F7FB3";
        default: return "#336699";
    }
}

/*==========================================================
PRIMITIVES SOUVERAINES (NETTES)
==========================================================*/
function dessinerPrimitiveSouveraine(ctx, forme) {
    ctx.beginPath();
    const s = 6; 
    switch(forme) {
        case "rectangle":
            ctx.moveTo(0, -s*1.5); ctx.lineTo(0, s*1.5);
            break;
        case "carre":
            ctx.rect(-s/2, -s/2, s, s);
            break;
        case "cercle":
            ctx.arc(0, 0, s/2, 0, Math.PI*2);
            break;
        case "croix":
            ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
            ctx.moveTo(0, -s); ctx.lineTo(0, s);
            break;
        case "losange":
            ctx.moveTo(0, -s); ctx.lineTo(s, 0);
            ctx.lineTo(0, s); ctx.lineTo(-s, 0);
            ctx.closePath();
            break;
    }
    ctx.stroke();
}

/*==========================================================
GLYPHE RÉALIGNÉ
==========================================================*/
function dessinerGlyphe(ctx, glyphe, angle){
    const rayon = glyphe.rayon; 
    const x = C + Math.cos(angle) * rayon;
    const y = C + Math.sin(angle) * rayon;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = couleur(glyphe.couleur);
    ctx.lineWidth = 1.2;

    const formes = ["rectangle", "carre", "cercle", "croix", "losange"];
    dessinerPrimitiveSouveraine(ctx, formes[glyphe.valeur % 5]);
    
    ctx.restore();
}

/*==========================================================
ANNEAU
==========================================================*/
function dessinerAnneau(ctx, liste, angleDepart){
    let angle = angleDepart;
    liste.forEach(glyphe => {
        angle += glyphe.espacement * Math.PI / 180;
        for(let i = 0; i < glyphe.cluster; i++){
            dessinerGlyphe(ctx, glyphe, angle + i * 0.018);
        }
        angle += 0.020;
    });
}

function dessinerBibliotheque(ctx, bibliotheque){
    dessinerAnneau(ctx, bibliotheque.noyau, Math.PI/8);
    dessinerAnneau(ctx, bibliotheque.transition, Math.PI/5);
    dessinerAnneau(ctx, bibliotheque.peripherie, Math.PI/3);
}

/*==========================================================
ÉLÉMENTS DÉCORATIFS (STRUCTURE ORIGINALE)
==========================================================*/
function cercle(ctx, r, epaisseur){
    ctx.beginPath();
    ctx.arc(C, C, r, 0, Math.PI*2);
    ctx.lineWidth = epaisseur;
    ctx.strokeStyle = BLEU;
    ctx.stroke();
}

function dessinerAnneauxDecoratifs(ctx){
    [[480,10],[466,1],[452,2],[438,1],[422,1],[406,.8],[390,.8],[374,.8],[358,.8],[342,.8],[326,.8],[310,.8],[294,.8],[278,.8],[262,.8],[246,.8]].forEach(e => cercle(ctx, e[0], e[1]));
}

function dessinerPointilles(ctx){
    ctx.save();
    ctx.setLineDash([2,4]);
    cercle(ctx, 372, 0.8);
    ctx.restore();
}

function dessinerRosace(ctx){
    ctx.save();
    ctx.translate(C, C);
    ctx.strokeStyle = BLEU;
    ctx.lineWidth = 0.9;
    for(let i = 0; i < 72; i++){
        ctx.save();
        ctx.rotate(i * Math.PI * 2 / 72);
        ctx.beginPath(); ctx.moveTo(0, 182); ctx.lineTo(0, 205); ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function dessinerGuilloche(ctx){
    ctx.beginPath();
    for(let a = 0; a <= Math.PI*2 + .003; a += .0025){
        const r = 458 + Math.sin(a*21)*5 + Math.cos(a*11)*2 + Math.sin(a*53);
        const x = C + Math.cos(a)*r;
        const y = C + Math.sin(a)*r;
        if(a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1; ctx.strokeStyle = BLEU; ctx.stroke();
}

function dessinerRayons(ctx){
    ctx.strokeStyle = "rgba(51,102,153,.10)";
    ctx.lineWidth = .35;
    for(let i = 0; i < 720; i++){
        const a = i * Math.PI * 2 / 720;
        ctx.beginPath();
        ctx.moveTo(C + Math.cos(a)*210, C + Math.sin(a)*210);
        ctx.lineTo(C + Math.cos(a)*448, C + Math.sin(a)*448);
        ctx.stroke();
    }
}

function dessinerPerles(ctx){
    ctx.fillStyle = BLEU;
    for(let i = 0; i < 240; i++){
        const a = i * Math.PI * 2 / 240;
        ctx.beginPath();
        ctx.arc(C + Math.cos(a)*468, C + Math.sin(a)*468, 1.05, 0, Math.PI*2);
        ctx.fill();
    }
}

function dessinerPerlesInternes(ctx){
    ctx.fillStyle = "rgba(51,102,153,.35)";
    [235, 280, 325].forEach(r => {
        for(let i = 0; i < 180; i++){
            const a = i * Math.PI * 2 / 180;
            ctx.beginPath();
            ctx.arc(C + Math.cos(a)*r, C + Math.sin(a)*r, .5, 0, Math.PI*2);
            ctx.fill();
        }
    });
}

function dessinerHalo(ctx){
    const g = ctx.createRadialGradient(C, C, 120, C, C, 300);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(.55, "rgba(51,102,153,.05)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(C, C, 300, 0, Math.PI*2); ctx.fill();
}

function dessinerMicroCercles(ctx){
    ctx.strokeStyle = "rgba(51,102,153,.18)";
    ctx.lineWidth = .35;
    for(let r = 255; r < 435; r += 22){
        ctx.beginPath(); ctx.arc(C, C, r, 0, Math.PI*2); ctx.stroke();
    }
}

function dessinerRepereNord(ctx){
    ctx.save(); ctx.translate(C, C); ctx.strokeStyle = BLEU; ctx.lineWidth = 2;
    for(let i = 0; i < 4; i++){
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, -478); ctx.lineTo(0, -455); ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function dessinerFinition(ctx){
    dessinerRepereNord(ctx);
    dessinerHalo(ctx);
    dessinerMicroCercles(ctx);
}

/*==========================================================
LOGO CENTRAL (PRÉSERVÉ)
==========================================================*/
async function chargerLogo(ctx){
    cercle(ctx, 214, 3);
    cercle(ctx, 206, 1);
    cercle(ctx, 198, .8);

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = "/logo_anor_master.png";
    });

    if(img.complete && img.naturalWidth){
        ctx.drawImage(img, C-182, C-182, 364, 364);
    } else {
        ctx.fillStyle = BLEU;
        ctx.font = "bold 84px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ANOR", C, C);
    }
}

/*==========================================================
MOTEUR PRINCIPAL
==========================================================*/
async function dessinerSceauPremium(bibliotheque){
    const ctx = getCtx("sceauCanvas");
    ctx.clearRect(0, 0, W, H);
    
    dessinerFond(ctx);
    dessinerGuilloche(ctx);
    dessinerAnneauxDecoratifs(ctx);
    dessinerPointilles(ctx);
    dessinerRayons(ctx);
    dessinerRosace(ctx);
    dessinerPerles(ctx);
    dessinerPerlesInternes(ctx);
    
    dessinerBibliotheque(ctx, bibliotheque);
    
    await chargerLogo(ctx);
    
    ctx.globalCompositeOperation = "source-over";
    dessinerFinition(ctx);
}

window.dessinerSceauPremium = dessinerSceauPremium;