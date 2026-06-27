/**
 * forgeRenderer.js - Moteur de Forge ANOR (Version Sérialisée enrichie)
 */

const ANOR_COLORS = ["#336699", "#2B547E", "#1F456E"];

function getCtx(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;
    return ctx;
}

// Fonction utilitaire pour dessiner les formes complexes
function dessinerForme(ctx, typeForme, x, y) {
    ctx.beginPath();
    switch(typeForme) {
        case "cercle": ctx.arc(x, y, 10, 0, Math.PI * 2); break;
        case "carre": ctx.rect(x-10, y-10, 20, 20); break;
        case "triangle": ctx.moveTo(x, y-10); ctx.lineTo(x-10, y+10); ctx.lineTo(x+10, y+10); break;
        case "losange": ctx.moveTo(x, y-12); ctx.lineTo(x+12, y); ctx.lineTo(x, y+12); ctx.lineTo(x-12, y); break;
        case "croix": ctx.moveTo(x-10, y); ctx.lineTo(x+10, y); ctx.moveTo(x, y-10); ctx.lineTo(x, y+10); break;
        default: ctx.arc(x, y, 5, 0, Math.PI * 2); // Forme par défaut (point)
    }
    ctx.stroke();
}

function dessinerSceauGeneratif(signature, bibliotheque, timestamp) {
    const ctx = getCtx("sceauCanvas");
    ctx.clearRect(0, 0, 1000, 1000);
    
    const seedString = signature + timestamp;
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);
    const rotation = (seed % 360) * (Math.PI / 180);

    ctx.save();
    ctx.translate(500, 500);
    ctx.rotate(rotation);

    // 1. Cercle Souverain
    ctx.strokeStyle = ANOR_COLORS[0];
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(0, 0, 450, 0, Math.PI * 2); ctx.stroke();

    // 2. Guilloches dynamiques
    ctx.strokeStyle = ANOR_COLORS[1];
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.01) {
            const r = 350 + Math.sin(a * (seed % 10 + i * 5)) * 50;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.stroke();
    }

    // 3. Marques de sérialisation basées sur la BIBLIOTHEQUE
    // On fusionne les anneaux pour le rendu visuel
    const formesAffichees = [
        ...(bibliotheque.noyau || []),
        ...(bibliotheque.transition || []),
        ...(bibliotheque.peripherie || [])
    ];

    ctx.lineWidth = 3;
    formesAffichees.forEach((item, index) => {
        if (index >= 30) return; // Limite le nombre de formes sur le sceau
        const angle = (index / 30) * Math.PI * 2;
        const x = Math.cos(angle) * 400;
        const y = Math.sin(angle) * 400;
        
        ctx.strokeStyle = item.bit === 1 ? ANOR_COLORS[0] : "#AABBCF";
        dessinerForme(ctx, item.forme, x, y);
    });

    // 4. Logo central
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(0, 0, 200, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ANOR_COLORS[0];
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ANOR", 0, 20);
    
    ctx.restore();
}

window.dessinerSceauPremium = dessinerSceauGeneratif;