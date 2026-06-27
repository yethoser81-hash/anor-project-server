// ===================================
// APP.JS
// CERVEAU PRINCIPAL APK ANOR
// ===================================

async function demarrerAnalyse() {

    try {

        afficherMessage("Initialisation...");

        document
        .getElementById("laser-line")
        .classList.remove("hidden");

        // IA caméra

        const meilleureImage = await CameraAI.capturer();
        console.log("Image capturée");

        // IA amélioration image

        const imageCorrigee = await ImageAI.corriger(
            meilleureImage.image
        );
        console.log("Image optimisée");

        if(!imageCorrigee){

            afficherMessage(
                "Erreur lecture image"
            );

            return;
        }

        // IA présence du sceau

        const validation = await SceauAI.verifier(imageCorrigee);

        if (!validation.success) {

            document
            .getElementById("laser-line")
            .classList.add("hidden");

            afficherMessage(
                validation.message
            );

            return;

        }

        afficherMessage("Décodage du sceau ANOR...");

        // Envoi Render

        const resultat = await API.verifier(imageCorrigee);

        if (resultat.success) {

            document
            .getElementById("laser-line")
            .classList.add("hidden");

            // Réalité augmentée

            OverlayRA.afficher(resultat);

            afficherProduit(resultat);

        }

        else {

            document
            .getElementById("laser-line")
            .classList.add("hidden");

            afficherContrefacon();

        }

    }

    catch(error){

        console.log(error);

        document
        .getElementById("laser-line")
        .classList.add("hidden");

        afficherMessage("Erreur système");

    }

}


// ===================================
// AFFICHAGE MESSAGE
// ===================================

function afficherMessage(message){

    const status = document.getElementById("status-msg");

    if(status){

        status.innerText = message;

    }

}


// ===================================
// ÉCRAN PRODUIT CERTIFIÉ
// ===================================

function afficherProduit(data){

    showScreen("screen-result");

    const imageProduit = data.produit.visuel_url 
        ? `assets/${data.produit.visuel_url}` 
        : "assets/p_default.png";

    document.getElementById("res-visual").src = imageProduit;

    document.getElementById("res-name").innerText =
        data.produit.nom_produit || "---";

    document.getElementById("res-company").innerText =
        data.produit.nom_producteur || "---";

    document.getElementById("res-batch").innerText =
        data.produit.lot || "---";

    document.getElementById("res-prod").innerText =
        data.produit.date_fabrication || "---";

    document.getElementById("res-exp").innerText =
        data.produit.date_peremption || "---";

    document.getElementById("res-norme").innerText =
        "ANOR";

}


// ===================================
// CONTREFAÇON
// ===================================

function afficherContrefacon(){

    showScreen("screen-report");

}


// ===================================
// GESTION DES ÉCRANS
// ===================================

function showScreen(id){

    document
    .querySelectorAll(".screen")
    .forEach(e => e.classList.add("hidden"));

    document
    .getElementById(id)
    .classList.remove("hidden");

}