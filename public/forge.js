/*
==========================================================
ANOR FORGE V10
forge.js
PARTIE 1 / 3
==========================================================
*/

// Point 10 : Suppression du bloc d'initialisation de la constante locale API pour utiliser window.API

let currentProductId = null;
let currentSignature = null;
let currentBibliotheque = null;

/*
==========================================================
INITIALISATION
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    chargerListePays();

    initialiserEvenements();

    basculerDates();

});

/*
==========================================================
EVENEMENTS
==========================================================
*/

function initialiserEvenements(){

    // Point 9 : Changement de l'événement de 'change' à 'input' pour le bon fonctionnement avec le datalist
    document
        .getElementById("pays_origine")
        .addEventListener("input", basculerDates);

    document
        .getElementById("visuel")
        .addEventListener("change", afficherPreview);

    // Liaison des actions aux boutons du DOM pour correspondre aux attributs window exposés en bas de script
    document.getElementById("btnForge").addEventListener("click", forgerProduit);
    document.getElementById("btnReset").addEventListener("click", reinitialiserForge);
    document.getElementById("btnPNG").addEventListener("click", exporterPNG);
    document.getElementById("btnKit").addEventListener("click", telechargerKit);

}

/*
==========================================================
NONCE AUTOMATIQUE
==========================================================
*/

function genererNonce(){

    return crypto.randomUUID();

}

/*
==========================================================
PREVIEW IMAGE
==========================================================
*/

function afficherPreview(e){

    const fichier = e.target.files[0];

    if(!fichier) return;

    const lecteur = new FileReader();

    lecteur.onload = function(evt){

        // Point 3 : Utilisation de l'identifiant exact de l'image 'previewImg'
        const img = document.getElementById("previewImg");

        img.src = evt.target.result;

        img.style.display = "block";

        // Point 3 : Utilisation de l'identifiant exact du placeholder 'imagePlaceholder'
        document
            .getElementById("imagePlaceholder")
            .style.display = "none";

    };

    lecteur.readAsDataURL(fichier);

}

/*
==========================================================
GESTION PAYS
==========================================================
*/

function basculerDates(){

    const pays = document
        .getElementById("pays_origine")
        .value
        .trim()
        .toLowerCase();

    const cameroun = pays==="cameroun";

    // Point 2 : Utilisation des identifiants exacts 'cameroonFields' et 'internationalFields'
    document
        .getElementById("cameroonFields")
        .style.display =
        cameroun ? "block":"none";

    document
        .getElementById("internationalFields")
        .style.display =
        cameroun ? "none":"block";

}

/*
==========================================================
STATUT
==========================================================
*/

function changerStatut(texte){

    // Point 5 : Utilisation de l'identifiant exact 'status'
    document
        .getElementById("status")
        .innerText = texte;

}

function afficherSignature(sig){

    // Point 6 : Utilisation de l'identifiant exact 'debug'
    document
        .getElementById("debug")
        .innerText = sig || "-";

}

/*
==========================================================
ANOR FORGE V10
forge.js
PARTIE 2 / 3
==========================================================
*/

/*
==========================================================
CONSTRUCTION DU FORMULAIRE
==========================================================
*/

function construireFormData(){

    const fd = new FormData();

    fd.append(
        "nom_produit",
        document.getElementById("nom_produit").value.trim()
    );

    fd.append(
        "nom_producteur",
        document.getElementById("nom_producteur").value.trim()
    );

    fd.append(
        "composition",
        document.getElementById("composition").value.trim()
    );

    fd.append(
        "lot",
        document.getElementById("lot").value.trim()
    );

    fd.append(
        "quantite_totale",
        document.getElementById("quantite_totale").value
    );

    fd.append(
        "type_emballage",
        document.getElementById("type_emballage").value.trim()
    );

    fd.append(
        "pays_origine",
        document.getElementById("pays_origine").value.trim()
    );

    /*
    NONCE
    Généré automatiquement.
    L'utilisateur ne le saisit plus.
    Point 11 : Le nonce reste une donnée purement interne.
    */

    fd.append(
        "nonce",
        genererNonce()
    );

    /*
    Dates
    */

    const pays = document
        .getElementById("pays_origine")
        .value
        .trim()
        .toLowerCase();

    if(pays==="cameroun"){

        fd.append(
            "date_certificat_conformite",
            document.getElementById("date_certificat_conformite").value
        );

    }else{

        fd.append(
            "date_fabrication",
            document.getElementById("date_fabrication").value
        );

        fd.append(
            "date_peremption",
            document.getElementById("date_peremption").value
        );

    }

    /*
    Upload PDF
    */

    const pdf =
        document.getElementById("certificat_pdf").files[0];

    if(pdf){

        fd.append(
            "certificat_pdf",
            pdf
        );

    }

    /*
    Upload Image
    */

    const image =
        document.getElementById("visuel").files[0];

    if(image){

        fd.append(
            "visuel",
            image
        );

    }

    return fd;

}

/*
==========================================================
VALIDATION
==========================================================
*/

function verifierFormulaire(){

    if(
        document.getElementById("nom_produit").value.trim()===""
    ){

        alert("Nom du produit obligatoire.");

        return false;

    }

    if(
        document.getElementById("nom_producteur").value.trim()===""
    ){

        alert("Nom du producteur obligatoire.");

        return false;

    }

    if(
        document.getElementById("lot").value.trim()===""
    ){

        alert("Le numéro de lot est obligatoire.");

        return false;

    }

    if(
        document.getElementById("pays_origine").value.trim()===""
    ){

        alert("Veuillez préciser le pays d'origine.");

        return false;

    }

    if(
        document.getElementById("visuel").files.length===0
    ){

        alert("Veuillez sélectionner le visuel du produit.");

        return false;

    }

    return true;

}

/*
==========================================================
ENVOI AU SERVEUR
==========================================================
*/

async function forgerProduit(){

    if(!verifierFormulaire()) return;

    changerStatut("GÉNÉRATION...");

    try{

        const formData = construireFormData();

        // Point 10 : Utilisation de window.API
        const response = await fetch(

            `${window.API}/produit/enregistrer`,

            {

                method:"POST",

                body:formData

            }

        );

        const resultat = await response.json();

        if(!resultat.success){

            throw new Error(resultat.message);

        }

        currentSignature = resultat.code_sceau;

        currentBibliotheque = resultat.bibliotheque;

        // Point 20 : Prise en charge de l'id renvoyé par le backend
        currentProductId =

            resultat.produit_id ||

            resultat.id ||

            null;

        afficherSignature(currentSignature);

        changerStatut("SCEAU GÉNÉRÉ");

        dessinerSceau();

    }

    catch(err){

        console.error(err);

        changerStatut("ERREUR");

        alert(err.message);

    }

}

/*
==========================================================
ANOR FORGE V10
forge.js
PARTIE 3 / 3
==========================================================
*/

/*
==========================================================
DESSINER LE SCEAU
==========================================================
*/

function dessinerSceau(){

    // Point 4 : Remplacement global par l'identifiant exact 'sceauCanvas'
    const canvas = document.getElementById("sceauCanvas");

    if(!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (typeof ForgeRenderer === "undefined") {

        ctx.fillStyle = "#ce1126";
        ctx.font = "20px Arial";
        ctx.fillText("ForgeRenderer non disponible", 40, 60);
        return;

    }

    const renderer = new ForgeRenderer(canvas);
    renderer.renderSceau(currentBibliotheque);

}

/*
==========================================================
TÉLÉCHARGER LE KIT COMPLET
==========================================================
*/

async function telechargerKit(){

    if(!currentProductId){

        alert("Générez un sceau d'abord.");

        return;

    }

    // Point 10 : Utilisation de window.API
    window.open(`${window.API}/produit/kit/${currentProductId}`, "_blank");

}

/*
==========================================================
EXPORTER EN PNG
==========================================================
*/

function exporterPNG(){

    // Point 4 : Remplacement global par l'identifiant exact 'sceauCanvas'
    const canvas = document.getElementById("sceauCanvas");

    if(!canvas){

        alert("Canvas introuvable.");

        return;

    }

    const lien = document.createElement("a");

    lien.download = `Sceau_ANOR_${Date.now()}.png`;
    lien.href = canvas.toDataURL("image/png");
    lien.click();

    // Point 8 : Suppression de l'appel log()
}

/*
==========================================================
RÉINITIALISER LA FORGE
==========================================================
*/

function reinitialiserForge(){

    document.getElementById("forgeForm").reset();

    currentProductId = null;
    currentSignature = null;
    currentBibliotheque = null;

    // Point 4 : Remplacement global par l'identifiant exact 'sceauCanvas'
    const canvas = document.getElementById("sceauCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Point 3 : Remplacement par 'previewImg' et 'imagePlaceholder'
    document.getElementById("previewImg").style.display = "none";
    document.getElementById("imagePlaceholder").style.display = "flex";

    afficherSignature("-");
    changerStatut("TERMINAL PRÊT");

    // Point 8 : Suppression de l'appel log()
}

/*
==========================================================
COPIER LA SIGNATURE
==========================================================
*/

async function copierSignature(){

    if(!currentSignature){

        alert("Aucune signature à copier.");

        return;

    }

    try{

        await navigator.clipboard.writeText(currentSignature);

        // Point 8 : Suppression de l'appel log()
    }

    catch(e){

        alert("Impossible de copier.");

    }

}

/*
==========================================================
RACCORCIS CLAVIER
==========================================================
*/

document.addEventListener("keydown", (e) => {

    if(e.ctrlKey && e.key === "Enter"){

        e.preventDefault();
        forgerProduit();

    }

    if(e.ctrlKey && e.key === "s"){

        e.preventDefault();
        telechargerKit();

    }

    if(e.key === "Escape"){

        reinitialiserForge();

    }

});

/*
==========================================================
EXPOSITION DES FONCTIONS GLOBALES
==========================================================
*/

window.genererSceau = forgerProduit;
window.downloadKit = telechargerKit;
window.exportPNG = exporterPNG;
window.resetForge = reinitialiserForge;
window.copySignature = copierSignature;
window.nouvelleSession = reinitialiserForge;

/*
==========================================================
CHARGEMENT LISTE PAYS
==========================================================
*/

async function chargerListePays(){

    try{

        const pays = [
            "Cameroun", "France", "États-Unis", "Chine", "Allemagne", "Brésil", "Inde", "Royaume-Uni", "Canada", "Espagne", "Italie", "Australie"
        ];

        const datalist = document.getElementById("listePays");

        pays.forEach(pays => {

            const option = document.createElement("option");
            option.value = pays;
            datalist.appendChild(option);

        });

        // Point 8 : Suppression de l'appel log()
    }catch(err){

        console.error("Erreur de chargement des pays.", err);

    }

}

// Point 8 : Suppression de la définition complète de la fonction log()