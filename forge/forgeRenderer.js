/**
 * ============================================================
 * forgeRenderer.js - L'orchestrateur du Sceau Souverain
 * ============================================================
 */

function genererSceau(canvasId, sealData) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const C = W / 2; // Centre du sceau

    // 1. Nettoyage et initialisation
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#336699"; // Bleu ANOR
    ctx.lineWidth = 1;

    // 2. Fond : Tracé des Guilloches (Sécurité de fond)
    // Nous utilisons le module dessin_guilloches.js
    dessinerGuilloche(ctx, C, C, 300, 20, 10);
    dessinerGuilloche(ctx, C, C, 250, 40, 5);

    // 3. Structure : Cercles concentriques
    for(let r of [350, 200]) {
        ctx.beginPath();
        ctx.arc(C, C, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 4. Glyphes : Placement sur les couronnes
    // Utilisation du module dessin_glyphes.js
    const nombreGlyphes = 24;
    for (let i = 0; i < nombreGlyphes; i++) {
        const angle = (i / nombreGlyphes) * Math.PI * 2;
        const rayon = 275;
        const x = C + Math.cos(angle) * rayon;
        const y = C + Math.sin(angle) * rayon;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        // Appel au module dessin_glyphes.js
        dessinerGlyphe(ctx, { 
            type: i % 7, 
            taille: 15 
        });
        
        ctx.restore();
    }
}

// Exposition au système
window.genererSceau = genererSceau;