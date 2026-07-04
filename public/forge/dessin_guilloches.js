/**
 * ============================================================
 * dessin_guilloches.js
 * Moteur de motifs ondulatoires de sécurité
 * ============================================================
 */

/**
 * Dessine un motif guilloché circulaire complexe
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} cx - Centre X
 * @param {number} cy - Centre Y
 * @param {number} rayonBase - Rayon moyen
 * @param {number} frequence - Nombre d'ondulations
 * @param {number} amplitude - Intensité des ondes
 */
function dessinerGuilloche(ctx, cx, cy, rayonBase, frequence, amplitude) {
    ctx.save();
    ctx.beginPath();
    
    // Détermination de la résolution du tracé (pas de 0.01 radian)
    const pas = 0.01;
    
    for (let a = 0; a <= Math.PI * 2; a += pas) {
        // La magie des mathématiques pour créer l'entrelac
        const r = rayonBase + Math.sin(a * frequence) * amplitude;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        
        if (a === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.closePath();
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
}

// Exportation pour le moteur de rendu
window.dessinerGuilloche = dessinerGuilloche;