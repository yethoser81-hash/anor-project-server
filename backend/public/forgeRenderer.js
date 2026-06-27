/**
 * forgeRenderer.js - Moteur de Forge ANOR (Version Souveraine Restituée)
 */

const ANOR_COLORS = ["#336699", "#2B547E", "#1F456E"];

function getCtx(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;
    return ctx;
}

// Rendu précis des formes selon le type
function dessinerForme(ctx, typeForme, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = ANOR_COLORS[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    switch(typeForme) {
        case "cercle": ctx.arc(0, 0, 8, 0, Math.PI * 2); break;
        case "carre": ctx.rect(-8, -8, 16, 16); break;
        case "triangle": ctx.moveTo(0, -10); ctx.lineTo(-10, 8); ctx.lineTo(10, 8); ctx.closePath(); break;
        case "losange": ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0); ctx.closePath(); break;
        case "croix": ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); break;
        default: ctx.arc(0, 0, 4, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.restore();
}

function dessinerSceauGeneratif(signature, bibliotheque, timestamp) {
    const ctx = getCtx("sceauCanvas");
    ctx.clearRect(0, 0, 1000, 1000);
    
    // Chargement du logo central
    const logo = new Image();
    logo.src = 'logo_anor.png';

    ctx.save();
    ctx.translate(500, 500);

    // 1. Cercle Souverain de base
    ctx.strokeStyle = ANOR_COLORS[0];
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, 0, 450, 0, Math.PI * 2); ctx.stroke();

    // 2. Rendu sur 3 niveaux (Noyau, Transition, Périphérie)
    const niveaux = [
        { data: bibliotheque.noyau || [], rayon: 250 },
        { data: bibliotheque.transition || [], rayon: 350 },
        { data: bibliotheque.peripherie || [], rayon: 420 }
    ];

    niveaux.forEach((niveau) => {
        niveau.data.forEach((item, i) => {
            const angle = (i / niveau.data.length) * Math.PI * 2;
            const x = Math.cos(angle) * niveau.rayon;
            const y = Math.sin(angle) * niveau.rayon;
            dessinerForme(ctx, item.forme, x, y);
        });
    });

    // 3. Logo central (forcé au centre après le dessin des formes)
    logo.onload = () => {
        ctx.drawImage(logo, -150, -150, 300, 300);
    };
    
    ctx.restore();
}

window.dessinerSceauPremium = dessinerSceauGeneratif;