/**
 * ============================================================
 * forgeRenderer.js - VERSION SOUVERAINE ÉPURÉE
 * Rendu minimaliste, géométrique et souverain
 * ============================================================
 */

const W = 1000, H = 1000, C = 500;
const BLEU = "#5B9BD5"; // Bleu souverain

function getCtx(id) {
    const canvas = document.getElementById(id);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    return ctx;
}

// Dessin des glyphes souverains (minimalistes)
function dessinerGlypheSouverain(ctx, angle, type) {
    const rayon = 400;
    const x = C + Math.cos(angle) * rayon;
    const y = C + Math.sin(angle) * rayon;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.strokeStyle = BLEU;
    ctx.lineWidth = 4;

    ctx.beginPath();
    switch(type % 4) {
        case 0: // Barre
            ctx.moveTo(0, -15); ctx.lineTo(0, 15); break;
        case 1: // Croix
            ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
            ctx.moveTo(0, -10); ctx.lineTo(0, 10); break;
        case 2: // Carré
            ctx.rect(-8, -8, 16, 16); break;
        case 3: // Cercle
            ctx.arc(0, 0, 8, 0, Math.PI * 2); break;
    }
    ctx.stroke();
    ctx.restore();
}

async function dessinerSceauPremium(bibliotheque) {
    const ctx = getCtx("sceauCanvas");
    ctx.fillStyle = "#000000"; // Fond noir
    ctx.fillRect(0, 0, W, H);

    // 1. Cercle central (Logo)
    ctx.beginPath();
    ctx.arc(C, C, 150, 0, Math.PI * 2);
    ctx.strokeStyle = BLEU;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Texte Central (Simulation logo)
    ctx.fillStyle = BLEU;
    ctx.textAlign = "center";
    ctx.font = "bold 40px Arial";
    ctx.fillText("ANOR", C, C - 20);
    ctx.font = "20px Arial";
    ctx.fillText("CERTIFIED", C, C + 30);

    // 3. Glyphes répartis
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        dessinerGlypheSouverain(ctx, angle, i);
    }
}

window.dessinerSceauPremium = dessinerSceauPremium;