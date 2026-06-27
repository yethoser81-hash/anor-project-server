async function dessinerSceauPremium(signature, bibliotheque) {
    const canvas = document.getElementById('sceauCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1000, 1000);
    ctx.imageSmoothingEnabled = true;

    // 1. Cercle de sécurité
    ctx.strokeStyle = BLEU_ANOR;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(CENTRE_HD, CENTRE_HD, 480, 0, Math.PI * 2); ctx.stroke();

    // 2. Rendu des anneaux (Code inchangé)
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

    // 3. Logo central sécurisé (Fallback automatique)
    const imgLogo = new Image();
    imgLogo.src = 'logo_anor.png';
    
    imgLogo.onload = () => {
        ctx.drawImage(imgLogo, CENTRE_HD - 180, CENTRE_HD - 180, 360, 360);
    };

    imgLogo.onerror = () => {
        console.warn("Logo non trouvé, utilisation du mode texte.");
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(CENTRE_HD, CENTRE_HD, 180, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = BLEU_ANOR;
        ctx.font = "bold 100px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ANOR", CENTRE_HD, CENTRE_HD);
    };
}