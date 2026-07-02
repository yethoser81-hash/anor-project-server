/**
 * forgeRenderer.js - VERSION SOUVERAINE (Minimaliste)
 */

const BLEU = "#336699";
const W = 1000; const H = 1000; const C = 500;

function getCtx(id) {
    const canvas = document.getElementById(id);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "butt";
    return ctx;
}

// Primitives épurées pour le Sceau Souverain
function dessinerSymbole(ctx, type, size) {
    ctx.beginPath();
    const s = size / 2;
    switch(type) {
        case 0: ctx.rect(-s, -s, size, size); break; // Carré
        case 1: ctx.arc(0, 0, s, 0, Math.PI * 2); break; // Cercle
        case 2: ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.moveTo(0, -s); ctx.lineTo(0, s); break; // Croix
        case 3: ctx.moveTo(0, -size); ctx.lineTo(0, size); break; // Barre
        case 4: ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); break; // Losange
    }
    ctx.stroke();
}

function dessinerSceauSouverain(bibliotheque) {
    const ctx = getCtx("sceauCanvas");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = BLEU;
    ctx.lineWidth = 2;

    // 1. Dessiner les cercles de structure
    [250, 350, 450].forEach(r => {
        ctx.beginPath();
        ctx.arc(C, C, r, 0, Math.PI * 2);
        ctx.stroke();
    });

    // 2. Dessiner les glyphes alignés (logique simplifiée)
    const dessinerAnneau = (zone, rayon) => {
        const count = zone.length;
        zone.forEach((g, i) => {
            const angle = (i / count) * Math.PI * 2;
            const x = C + Math.cos(angle) * rayon;
            const y = C + Math.sin(angle) * rayon;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            // On utilise la valeur du glyphe pour choisir le symbole (0-4)
            dessinerSymbole(ctx, g.valeur % 5, 12);
            ctx.restore();
        });
    };

    dessinerAnneau(bibliotheque.noyau, 250);
    dessinerAnneau(bibliotheque.transition, 350);
    dessinerAnneau(bibliotheque.peripherie, 450);

    // 3. Logo central
    ctx.fillStyle = BLEU;
    ctx.beginPath(); ctx.arc(C, C, 150, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "bold 60px Arial"; ctx.textAlign = "center";
    ctx.fillText("ANOR", C, C + 20);
}

window.dessinerSceauPremium = dessinerSceauSouverain;