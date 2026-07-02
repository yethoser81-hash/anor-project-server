/**
 * ============================================================
 * forgeRenderer.js - MOTEUR DE RENDU COMPLET (ANOR V4)
 * Intégration totale des Primitives, Glyphes et Structure
 * ============================================================
 */

// --- 1. CONFIGURATION ---
const W = 1000;
const H = 1000;
const C = 500;
const BLEU = "#336699";

function getCtx(id) {
    const canvas = document.getElementById(id);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
}

// --- 2. VOS PRIMITIVES ET GLYPHES (INTÉGRÉS) ---
const PRIMITIVES = {
    rectangle: (ctx, l, h) => { ctx.beginPath(); ctx.rect(-l/2, -h/2, l, h); },
    carre: (ctx, t) => { ctx.beginPath(); ctx.rect(-t/2, -t/2, t, t); },
    cercle: (ctx, r) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); },
    triangle: (ctx, t) => { ctx.beginPath(); ctx.moveTo(0, -t); ctx.lineTo(t, t); ctx.lineTo(-t, t); ctx.closePath(); },
    losange: (ctx, t) => { ctx.beginPath(); ctx.moveTo(0, -t); ctx.lineTo(t, 0); ctx.lineTo(0, t); ctx.lineTo(-t, 0); ctx.closePath(); },
    croix: (ctx, t) => { ctx.beginPath(); ctx.moveTo(-t, 0); ctx.lineTo(t, 0); ctx.moveTo(0, -t); ctx.lineTo(0, t); },
    barre: (ctx, t) => { ctx.beginPath(); ctx.rect(-t*.15, -t, t*.30, t*2); },
    arc: (ctx, r) => { ctx.beginPath(); ctx.arc(0, 0, r, Math.PI*.15, Math.PI*1.85); }
};

function dessinerGlyphe(ctx, glyphe) {
    const t = glyphe.taille;
    ctx.save();
    ctx.strokeStyle = BLEU;
    ctx.lineWidth = 1.5;
    
    switch(glyphe.type) {
        case 0: PRIMITIVES.rectangle(ctx, t*.55, t*1.8); break;
        case 1: PRIMITIVES.rectangle(ctx, t*.4, t*1.5); ctx.translate(t*.7, 0); PRIMITIVES.rectangle(ctx, t*.4, t*1.5); break;
        case 2: PRIMITIVES.rectangle(ctx, t*.35, t*1.6); ctx.translate(t*.65, 0); PRIMITIVES.rectangle(ctx, t*.35, t*1.2); ctx.translate(t*.65, 0); PRIMITIVES.rectangle(ctx, t*.35, t*1.6); break;
        case 3: PRIMITIVES.cercle(ctx, t*.45); ctx.translate(t*.85, 0); PRIMITIVES.rectangle(ctx, t*.3, t*1.2); break;
        case 4: PRIMITIVES.losange(ctx, t*.55); ctx.translate(t*.85, 0); PRIMITIVES.rectangle(ctx, t*.35, t*1.4); break;
        case 5: PRIMITIVES.arc(ctx, t*.65); ctx.translate(t*.8, 0); PRIMITIVES.rectangle(ctx, t*.35, t*1.4); break;
        case 6: PRIMITIVES.croix(ctx, t*.55); ctx.translate(t*.75, 0); PRIMITIVES.cercle(ctx, t*.25); break;
        default: PRIMITIVES.rectangle(ctx, t*.4, t*1.4);
    }
    ctx.stroke();
    ctx.restore();
}

// --- 3. STRUCTURE ET GUILLOCHES (MOTEUR DE DENSITÉ) ---
function dessinerSceauPremium() {
    const ctx = getCtx("generated-seal");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = BLEU;

    // Guillochage externe (Haute densité)
    ctx.beginPath();
    for (let a = 0; a <= Math.PI*2 + 0.01; a += 0.002) {
        const r = 450 + Math.sin(a*30)*10 + Math.cos(a*15)*5;
        const x = C + Math.cos(a)*r;
        const y = C + Math.sin(a)*r;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Anneaux concentriques
    [400, 370, 340, 310, 280].forEach(r => {
        ctx.beginPath(); ctx.arc(C, C, r, 0, Math.PI*2);
        ctx.lineWidth = 1; ctx.stroke();
    });

    // Placement dense des glyphes (4 couronnes de 20 glyphes)
    for(let ring = 0; ring < 4; ring++) {
        for(let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + (ring * 0.2);
            const r = 380 - (ring * 30);
            ctx.save();
            ctx.translate(C + Math.cos(angle)*r, C + Math.sin(angle)*r);
            ctx.rotate(angle + Math.PI/2);
            dessinerGlyphe(ctx, {type: (i+ring)%7, taille: 12});
            ctx.restore();
        }
    }

    // Logo et texte central
    ctx.fillStyle = BLEU;
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ANOR", C, C + 20);
    ctx.strokeRect(C-150, C-100, 300, 200);
}

// Exportation pour le front-end
window.dessinerSceauPremium = dessinerSceauPremium;