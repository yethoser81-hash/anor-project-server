/**
 * forgeRenderer.js - Moteur de Forge ANOR
 * Intégration sécurisée de logo_anor.png
 */

const BLEU_ANOR = "#336699";
const CENTRE_HD = 500;

// Fonction de dessin vectoriel inchangée pour les formes
function dessinerForme(ctx, forme, taille) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    switch(forme) {
        case "cercle": ctx.arc(0, 0, taille / 2, 0, Math.PI * 2); break;
        case "carre": ctx.rect(-taille/2, -taille/2, taille, taille); break;
        case "rectangle": ctx.rect(-taille, -taille/3, taille*2, taille/1.5); break;
        case "triangle": 
            ctx.moveTo(0, -taille * 0.6); ctx.lineTo(taille * 0.7, taille * 0.7); ctx.lineTo(-taille * 0.7, taille * 0.7); 
            break;
        case "losange": 
            ctx.moveTo(0, -taille * 0.8); ctx.lineTo(taille * 0.8, 0); ctx.lineTo(0, taille * 0.8); ctx.lineTo(-taille * 0.8, 0); 
            break;
        case "croix": 
            ctx.moveTo(-taille*0.7, 0); ctx.lineTo(taille*0.7, 0); ctx.moveTo(0, -taille*0.7); ctx.lineTo(0, taille*0.7); 
            break;
    }
    ctx.closePath();
    ctx.stroke();
}

async function dessinerSceauPremium(signature, bibliotheque) {
    const canvas = document.getElementById('sceauCanvas');
    const ctx = canvas.getContext('2d');
    
    // Chargement de l'image de manière synchrone via une Promise
    const imgLogo = new Image();
    imgLogo.src = 'logo_anor.png';
    
    await new Promise((resolve, reject) => {
        imgLogo.onload = resolve;
        imgLogo.onerror = reject;
    });

    ctx.clearRect(0, 0, 1000, 1000);
    ctx.imageSmoothingEnabled = true;

    // 1. Cercle de sécurité
    ctx.strokeStyle = BLEU_ANOR;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(CENTRE_HD, CENTRE_HD, 480, 0, Math.PI * 2); ctx.stroke();

    // 2. Rendu des anneaux (Structure radiale fixe)
    const anneaux = [
        { data: bibliotheque.noyau, rayon: 240, size: 14 },
        { data: bibliotheque.transition, rayon: 330, size: 18 },
        { data: bibliotheque.peripherie, rayon: 420, size: 22 }
    ];

    anneaux.forEach((anneau) => {
        const total = anneau.data.length;
        for(let i = 0; i < total; i++) {
            const angle = (i / total) * Math.PI * 2;
            const x = CENTRE_HD + Math.cos(angle) * anneau.rayon;
            const y = CENTRE_HD + Math.sin(angle) * anneau.rayon;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.strokeStyle = BLEU_ANOR;
            dessinerForme(ctx, anneau.data[i].forme, anneau.size);
            ctx.restore();
        }
    });

    // 3. Logo central (Intégré après chargement confirmé)
    ctx.drawImage(imgLogo, CENTRE_HD - 180, CENTRE_HD - 180, 360, 360);
}
