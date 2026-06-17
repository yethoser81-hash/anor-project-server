const crypto = require('crypto');

// Structure en mémoire pour suivre les tentatives par adresse IP (Anti-brute-force)
const ipCache = {};

/**
 * Nettoie le cache des adresses IP toutes les 10 minutes pour éviter la saturation mémoire
 */
setInterval(() => {
    const maintenant = Date.now();
    for (const ip in ipCache) {
        if (maintenant - ipCache[ip].resetTime > 600000) {
            delete ipCache[ip];
        }
    }
}, 600000);

/**
 * Middleware de limitation des requêtes (Rate Limiting maison pour Render)
 * Limite chaque IP à 15 scans par minute pour bloquer les robots de force brute.
 */
function limiterRequetes(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const maintenant = Date.now();

    if (!ipCache[ip]) {
        ipCache[ip] = {
            compteur: 1,
            resetTime: maintenant + 60000        // 1 minute de fenêtre
        };
        return next();
    }

    if (maintenant > ipCache[ip].resetTime) {
        // La minute est passée, on réinitialise le compteur
        ipCache[ip].compteur = 1;
        ipCache[ip].resetTime = maintenant + 60000;
        return next();
    }

    ipCache[ip].compteur++;

    if (ipCache[ip].compteur > 15) {
        return res.status(429).json({
            authentique: false,
            message: "Trop de requêtes de scan. Veuillez attendre une minute."
        });
    }

    next();
}

/**
 * Validation stricte des données reçues pour le contrôle d'un sceau (Anti-injection)
 */
function validerPayloadScan(req, res, next) {
    const { id_sceau, matrice_scanne } = req.body;

    // 1. Vérification de l'ID Sceau (Doit être exactement 8 caractères alphanumériques)
    const regexId = /^[a-zA-Z0-9]{8}$/;
    if (!id_sceau || !regexId.test(id_sceau)) {
        return res.status(400).json({
            authentique: false,
            message: "Format de l'identifiant du sceau invalide."
        });
    }

    // 2. Vérification de la matrice (Doit être une chaîne de 64 caractères contenant uniquement des 0 et des 1)
    const regexMatrice = /^[01]{64}$/;
    if (!matrice_scanne || !regexMatrice.test(matrice_scanne)) {
        return res.status(400).json({
            authentique: false,
            message: "Format de la matrice géométrique invalide."
        });
    }

    next();
}

/**
 * Génère une matrice binaire aléatoire de 64 caractères (0 et 1)
 */
function genererMatriceSecurite() {
    let matrice = "";
    for (let i = 0; i < 64; i++) {
        matrice += crypto.randomInt(0, 2).toString();
    }
    return matrice;
}

/**
 * Forge le code source du Sceau SVG en y injectant l'ID et la matrice géométrique
 */
function forgerSceauSVG(idSceau, matrice) {
    const timestamp = new Date().toISOString();
    
    // Le SVG embarque les données sous forme d'attributs lisibles par ton scanner
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" id="anor-sceau-${idSceau}" data-id-sceau="${idSceau}" data-matrice="${matrice}">
  <metadata id="anor-security-payload">
    <sceau-id>${idSceau}</sceau-id>
    <matrice-geometrique>${matrice}</matrice-geometrique>
    <timestamp>${timestamp}</timestamp>
  </metadata>

  <circle cx="100" cy="100" r="90" fill="none" stroke="#0066cc" stroke-width="5" stroke-dasharray="4,4" />
  <circle cx="100" cy="100" r="82" fill="#ffffff" stroke="#0066cc" stroke-width="2" />
  
  <path d="M 50,100 L 150,100 M 100,50 L 100,150" fill="none" stroke="#e74c3c" stroke-width="1.5" opacity="0.4" />
  <circle cx="100" cy="100" r="45" fill="none" stroke="#0066cc" stroke-width="1" stroke-dasharray="2,2" />

  <path id="textPathSceau" d="M 35,100 A 65,65 0 1,1 165,100" fill="none" />
  <text fill="#0066cc" font-family="Arial, sans-serif" font-size="10" font-weight="bold" letter-spacing="1.5">
    <textPath href="#textPathSceau" startOffset="50%" text-anchor="middle">• ANOR-CHECK AUTOMATION •</textPath>
  </text>

  <circle cx="100" cy="100" r="28" fill="#0066cc" />
  <text x="100" y="104" fill="#ffffff" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">
    ${idSceau}
  </text>
  
  <text x="100" y="160" fill="#7f8c8d" font-family="Arial, sans-serif" font-size="7" font-weight="bold" text-anchor="middle">
    SECURE SEAL
  </text>
</svg>`;

    return svgContent;
}

module.exports = {
    limiterRequetes,
    validerPayloadScan,
    genererMatriceSecurite,
    forgerSceauSVG
};