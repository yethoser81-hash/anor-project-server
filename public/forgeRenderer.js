/**
 * ============================================================
 * forgeRenderer.js
 * Moteur complet - Assemblage Souverain ANOR V4
 * ============================================================
 */

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

// 1. DESSIN DE LA STRUCTURE DE FOND (GUILLOCHE/ANNEAUX)
function dessinerStructureDeFond(ctx) {
    ctx.strokeStyle = BLEU;
    
    // Guilloche simplifiée mais autoritaire
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.01) {
        const r = 450 + Math.sin(a * 20) * 8;
        const x = C + Math.cos(a) * r;
        const y = C + Math.sin(a) * r;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Anneaux décoratifs
    [400, 350, 300, 250].forEach(r => {
        ctx.beginPath();
        ctx.arc(C, C, r, 0, Math.PI * 2);
        ctx.lineWidth = 0.5;
        ctx.stroke();
    });
}

// 2. RENDU DES GLYPHES UTILISANT VOS PRIMITIVES
function dessinerCouronneGlyphes(ctx, listeGlyphes) {
    listeGlyphes.forEach((g, i) => {
        const angle = (i / listeGlyphes.length) * Math.PI * 2;
        const rayon = 350;
        const x = C + Math.cos(angle) * rayon;
        const y = C + Math.sin(angle) * rayon;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        // Utilisation de votre fonction importée (déclarée globalement via window)
        window.dessinerGlyphe(ctx, { 
            type: i % 7, 
            taille: 15 
        });
        
        ctx.strokeStyle = BLEU;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    });
}

// 3. LOGO CENTRAL
async function dessinerLogo(ctx) {
    ctx.fillStyle = BLEU;
    ctx.textAlign = "center";
    ctx.font = "bold 60px Arial";
    ctx.fillText("ANOR", C, C);
    ctx.font = "20px Arial";
    ctx.fillText("CERTIFIED", C, C + 40);
    
    ctx.beginPath();
    ctx.arc(C, C, 120, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.stroke();
}

// 4. MOTEUR D'ASSEMBLAGE PRINCIPAL
async function dessinerSceauPremium(bibliotheque) {
    const ctx = getCtx("sceauCanvas");
    ctx.clearRect(0, 0, W, H);
    
    // Fond
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    
    // Assemblage
    dessinerStructureDeFond(ctx);
    dessinerCouronneGlyphes(ctx, Array(30).fill({})); 
    await dessinerLogo(ctx);
}

window.dessinerSceauPremium = dessinerSceauPremium;