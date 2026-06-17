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

module.exports = {
    limiterRequetes,
    validerPayloadScan
};