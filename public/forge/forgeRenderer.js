/**
 * ==========================================================
 * forge/forgeRenderer.js
 * ANOR V7
 * Moteur de rendu des glyphes + couronnes
 * ==========================================================
 */

/**
 * ==========================================================
 * OUTIL CANVAS
 * ==========================================================
 */

class Renderer {
    constructor(canvas, bibliotheque = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        
        // Utilise la bibliothèque passée en argument ou tente de charger via require pour le backend
        this.GLYPHES = bibliotheque || (typeof require !== 'undefined' ? require("./bibliotheque_glyphes") : []);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setStyle({ stroke = "#000", fill = null, width = 2 } = {}) {
        this.ctx.strokeStyle = stroke;
        this.ctx.lineWidth = width;
        this.ctx.fillStyle = fill;
    }

    /**
     * ==========================================================
     * PRIMITIVES (formes de base compatibles glyphes)
     * ==========================================================
     */

    drawCircle(x, y, r, fill = false) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);

        if (fill) ctx.fill();
        ctx.stroke();
    }

    drawRect(x, y, w, h) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.rect(x - w / 2, y - h / 2, w, h);
        ctx.stroke();
    }

    drawTriangle(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();

        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();

        ctx.stroke();
    }

    drawDiamond(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();

        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x + size, y);
        ctx.closePath();

        ctx.stroke();
    }

    drawCross(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();

        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);

        ctx.stroke();
    }

    drawBar(x, y, size) {
        this.drawRect(x, y, size / 3, size);
    }

    drawSemicircle(x, y, r) {
        const ctx = this.ctx;
        ctx.beginPath();

        ctx.arc(x, y, r, 0, Math.PI, false);
        ctx.stroke();
    }

    /**
     * ==========================================================
     * ROUTEUR DE FORMES
     * ==========================================================
     */

    drawShape(shape, e) {
        switch (shape) {
            case "cercle":
                this.drawCircle(e.x, e.y, e.taille, e.plein);
                break;

            case "rectangle":
                this.drawRect(e.x, e.y, e.largeur, e.hauteur);
                break;

            case "carre":
                this.drawRect(e.x, e.y, e.taille, e.taille);
                break;

            case "triangle":
                this.drawTriangle(e.x, e.y, e.taille);
                break;

            case "losange":
                this.drawDiamond(e.x, e.y, e.taille);
                break;

            case "croix":
                this.drawCross(e.x, e.y, e.taille);
                break;

            case "barre_verticale":
                this.drawBar(e.x, e.y, e.taille);
                break;

            case "demi_cercle":
                this.drawSemicircle(e.x, e.y, e.taille);
                break;

            default:
                console.warn("Forme inconnue :", shape);
        }
    }

    /**
     * ==========================================================
     * RENDU D'UN GLYPHE
     * ==========================================================
     */

    renderGlyphe(glyphe, offsetX = 0, offsetY = 0) {
        if (!glyphe) return;

        for (const e of glyphe.elements) {
            const x = this.centerX + offsetX + e.x;
            const y = this.centerY + offsetY + e.y;

            this.drawShape(e.forme, {
                ...e,
                x,
                y
            });
        }
    }

    /**
     * ==========================================================
     * RENDU D'UNE COURONNE (glyphe circulaire)
     * ==========================================================
     */

    renderCouronne(glyphes, radius = 120) {
        if (!glyphes || glyphes.length === 0) return;
        
        const count = glyphes.length;
        const step = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * step;

            const x = this.centerX + Math.cos(angle) * radius;
            const y = this.centerY + Math.sin(angle) * radius;

            this.renderGlyphe(glyphes[i], x - this.centerX, y - this.centerY);
        }
    }

    /**
     * ==========================================================
     * RENDU CENTRÉ SIMPLE
     * ==========================================================
     */

    renderCenter(nom) {
        const g = this.GLYPHES.find(g => g.nom === nom);
        this.renderGlyphe(g);
    }
}

/**
 * ==========================================================
 * EXPORT
 * ==========================================================
 */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}