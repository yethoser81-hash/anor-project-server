/**
 * forgeRenderer.js - Moteur de Forge ANOR (Version Haute Précision)
 * Rendu optimisé pour une lecture APK rapide et fiable.
 */

const BLEU_ANOR = "#336699";
const CENTRE_HD = 500;

// Fonction de dessin vectoriel propre
function dessinerForme(ctx, forme, taille) {
    ctx.beginPath();
    switch(forme) {
        case "cercle": ctx.arc(0, 0, taille / 2, 0, Math.PI * 2); break;
        case "carre": ctx.rect(-taille/2, -taille/2, taille, taille); break;
        case "rectangle": ctx.rect(-taille, -taille/3, taille*2, taille/1.5); break;
        case "triangle": 
            ctx.moveTo(0, -taille * 0.8); 
            ctx.lineTo(taille * 0.8, taille * 0.8); 
            ctx.lineTo(-taille * 0.8, taille * 0.8); 
            break;
        case "losange": 
            ctx.moveTo(0, -taille); ctx.lineTo(taille, 0); 
            ctx.lineTo(0, taille); ctx.lineTo(-taille, 0); 
            break;
        case "croix": 
            ctx.moveTo(-taille, 0); ctx.lineTo(taille, 0); 
            ctx.moveTo(0, -taille); ctx.lineTo(0, taille); 
            break;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

async function dessinerSceauPremium(signature, bibliotheque) {
    const canvas = document.getElementById('sceauCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1000, 1000);
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";

    // 1. Cercle de sécurité extérieur
    ctx.strokeStyle = BLEU_ANOR;
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(CENTRE_HD, CENTRE_HD, 470, 0, Math.PI * 2); ctx.stroke();

    // 2. Rendu des anneaux (Lecture APK facilitée)
    const anneaux = [
        { data: bibliotheque.noyau, rayon: 240, size: 16, decalage: 0 },
        { data: bibliotheque.transition, rayon: 330, size: 20, decalage: 0.03 },
        { data: bibliotheque.peripherie, rayon: 420, size: 26, decalage: 0.06 }
    ];

    anneaux.forEach((anneau) => {
        const total = anneau.data.length;
        for(let i = 0; i < total; i++) {
            const angle = (i / total) * Math.PI * 2 + anneau.decalage;
            const x = CENTRE_HD + Math.cos(angle) * anneau.rayon;
            const y = CENTRE_HD + Math.sin(angle) * anneau.rayon;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI / 2); // Aligné pour lecture optique

            ctx.fillStyle = "white";
            ctx.strokeStyle = BLEU_ANOR;
            ctx.lineWidth = 3;
            
            dessinerForme(ctx, anneau.data[i].forme, anneau.size);
            ctx.restore();
        }
    });

    // 3. Logo central ANOR
    ctx.fillStyle = BLEU_ANOR;
    ctx.beginPath(); ctx.arc(CENTRE_HD, CENTRE_HD, 180, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 90px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ANOR", CENTRE_HD, CENTRE_HD + 30);
}
