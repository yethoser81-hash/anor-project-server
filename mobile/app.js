/**
 * APP.JS - Logique Client Complète pour ANOR
 */

const SERVER_URL = "https://authbyyetho.onrender.com";

/**
 * 1. INITIALISATION DU SCANNER (Déclenché par le toucher sur le cercle)
 */
async function declencherScan() {
    const placeholder = document.getElementById('placeholder-ui');
    const laser = document.getElementById('laser-line');
    const status = document.getElementById('status-msg');

    // Masquage de l'icône de démarrage et activation du laser
    if (placeholder) placeholder.classList.add('hidden');
    if (laser) laser.classList.remove('hidden');
    
    status.innerText = "Initialisation du scanner...";

    try {
        // Chargement à la demande du flux Ultra-HD
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                },
                width: {
                    ideal: 3840
                },
                height: {
                    ideal: 2160
                }
            },
            audio: false
        });

        const video = document.getElementById('video-preview');
        video.srcObject = stream;
        await video.play();

        // --- CONFIGURATION DU ZOOM MATÉRIEL AUTOMATIQUE ---
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();

        if (capabilities.zoom) {
            await track.applyConstraints({
                advanced: [{ zoom: 1.5 }]
            });
        }

        status.innerText = "Positionnez le sceau ANOR";

        // Laisse 1.5 seconde à l'utilisateur pour cadrer et à la caméra pour stabiliser le focus
        setTimeout(() => {
            capturerEtAnalyser();
        }, 1500);

    } catch (err) {
        console.error("Échec d'accès caméra :", err);
        if (placeholder) placeholder.classList.remove('hidden');
        if (laser) laser.classList.add('hidden');
        status.innerText = "Pointez le sceau ANOR sécurisé";
        alert("Impossible d'accéder à la caméra.");
    }
}

/**
 * 2. CAPTURE AUTOMATIQUE ET SÉPARATION LOGIQUE
 */
async function capturerEtAnalyser() {
    const video = document.getElementById('video-preview');
    const canvas = document.getElementById('canvas-capture');
    const ctx = canvas.getContext('2d');

    // Utilisation de la géométrie réelle du flux vidéo 4K
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    document.getElementById('status-msg').innerText = "Vérification ANOR...";

    canvas.toBlob(async (blob) => {
        const file = new File([blob], "sceau.jpg", { type: "image/jpeg" });
        await envoyerSceauAuServeur(file);
    }, 'image/jpeg', 0.95);
}

/**
 * 3. ENVOI ET LIBÉRATION DU MATÉRIEL
 */
async function envoyerSceauAuServeur(imageFile) {
    const formData = new FormData();
    formData.append('sceau', imageFile);

    try {
        const response = await fetch(`${SERVER_URL}/api/produit/verifier`, {
            method: 'POST',
            body: formData 
        });

        const data = await response.json();

        // Désactivation de l'animation laser après traitement
        const laserLine = document.getElementById('laser-line');
        if (laserLine) laserLine.classList.add('hidden');

        if (response.ok && data.success) {
            afficherResultat(data.produit, data.confidence);
        } else {
            alert("❌ Échec : " + (data.message || "Sceau non reconnu"));
            document.getElementById('status-msg').innerText = "Pointez le sceau ANOR sécurisé";
            // Réapparition du placeholder d'accueil pour permettre un nouvel essai
            const placeholder = document.getElementById('placeholder-ui');
            if (placeholder) placeholder.classList.remove('hidden');
        }
    } catch (err) {
        const laserLine = document.getElementById('laser-line');
        if (laserLine) laserLine.classList.add('hidden');
        
        alert("Erreur de connexion au serveur central.");
        document.getElementById('status-msg').innerText = "Pointez le sceau ANOR sécurisé";
        
        const placeholder = document.getElementById('placeholder-ui');
        if (placeholder) placeholder.classList.remove('hidden');
    } finally {
        // --- COUPE PROPRE DES CAPTEURS EN FIN DE CYCLE ---
        const video = document.getElementById('video-preview');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    }
}

/**
 * 4. AFFICHAGE DES RÉSULTATS
 */
function afficherResultat(d, confidence) {
    const table = document.getElementById('res-table');
    if (table) {
        table.innerHTML = `
            <tr><td>Produit</td><td>${d.nom_produit}</td></tr>
            <tr><td>Producteur</td><td>${d.nom_producteur}</td></tr>
            <tr><td>Lot</td><td>${d.lot}</td></tr>
            <tr><td>Origine</td><td>${d.pays_origine}</td></tr>
            <tr><td>Confiance</td><td>${confidence}</td></tr>
        `;
    }
    showScreen('screen-result');
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// Exportation des fonctions globales pour les événements HTML inline
window.declencherScan = declencherScan;
window.showScreen = showScreen;