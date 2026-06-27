/**
 * forgeRenderer.js - Moteur de Forge ANOR (Version Sérialisée Complète)
 */

const ANOR_COLORS = ["#336699", "#2B547E", "#1F456E"];

function getCtx(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;
    return ctx;
}

// Moteur de dessin des formes de la bibliothèque
function dessinerForme(ctx, typeForme, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 4;
    ctx.beginPath();
    
    switch(typeForme) {
        case "cercle": ctx.arc(0, 0, 10, 0, Math.PI * 2); break;
        case "carre": ctx.rect(-10, -10, 20, 20); break;
        case "triangle": ctx.moveTo(0, -12); ctx.lineTo(-12, 10); ctx.lineTo(12, 10); ctx.closePath(); break;
        case "losange": ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.closePath(); break;
        case "croix": ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.moveTo(0, -10); ctx.lineTo(0, 10); break;
        case "etoile_cinq_branches": 
            for(let i=0; i<5; i++) {
                ctx.lineTo(Math.cos((18+i*72)*Math.PI/180)*15, Math.sin((18+i*72)*Math.PI/180)*15);
                ctx.lineTo(Math.cos((54+i*72)*Math.PI/180)*7, Math.sin((54+i*72)*Math.PI/180)*7);
            } break;
        default: ctx.arc(0, 0, 5, 0, Math.PI * 2); // Point par défaut
    }
    ctx.stroke();
    ctx.restore();
}

function dessinerSceauGeneratif(signature, bibliotheque, timestamp) {
    const ctx = getCtx("sceauCanvas");
    ctx.clearRect(0, 0, 1000, 1000);
    
    // Chargement du logo central (situé à côté de ce fichier)
    const logo = new Image();
    logo.src = 'logo_anor.png'; // Assurez-vous que ce fichier est dans /public/

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
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
            const r = 350 + Math.sin(a * (seed % 10 + i * 5)) * 50;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.stroke();
    }

    // 3. Marques de sérialisation (formes réelles de la bibliothèque)
    const formesAffichees = [
        ...(bibliotheque.noyau || []),
        ...(bibliotheque.transition || []),
        ...(bibliotheque.peripherie || [])
    ];

    formesAffichees.forEach((item, index) => {
        if (index >= 40) return; 
        const angle = (index / 40) * Math.PI * 2;
        const x = Math.cos(angle) * 400;
        const y = Math.sin(angle) * 400;
        
        ctx.strokeStyle = item.bit === 1 ? ANOR_COLORS[0] : "#AABBCF";
        dessinerForme(ctx, item.forme, x, y);
    });

    // 4. Logo central (appelé ici)
    logo.onload = () => {
        ctx.drawImage(logo, -150, -150, 300, 300);
    };
    
    ctx.restore();
}

window.dessinerSceauPremium = dessinerSceauGeneratif;