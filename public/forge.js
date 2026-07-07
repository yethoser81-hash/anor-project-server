/**
 * ==========================================================
 * forge.js
 * ANOR V10
 * Contrôleur interface Forge
 * ==========================================================
 */

/* ==========================================================
   LISTE DES PAYS
========================================================== */

const PAYS_MONDE = [
    "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Angola", "Arabie Saoudite", "Argentine", "Australie", "Autriche", 
    "Belgique", "Bénin", "Bolivie", "Brésil", "Bulgarie", "Burkina Faso", "Burundi", "Cameroun", "Canada", "Cap-Vert", "Chili", "Chine", 
    "Colombie", "Comores", "Congo", "Côte d'Ivoire", "Croatie", "Danemark", "Égypte", "Émirats arabes unis", "Espagne", "États-Unis", 
    "Éthiopie", "Finlande", "France", "Gabon", "Ghana", "Grèce", "Guinée", "Guinée équatoriale", "Haïti", "Hongrie", "Inde", "Indonésie", 
    "Irlande", "Italie", "Japon", "Kenya", "Liban", "Madagascar", "Malaisie", "Mali", "Maroc", "Maurice", "Mexique", "Mozambique", 
    "Namibie", "Niger", "Nigeria", "Norvège", "Nouvelle-Zélande", "Ouganda", "Pakistan", "Pays-Bas", "Pérou", "Philippines", "Pologne", 
    "Portugal", "Qatar", "République centrafricaine", "République démocratique du Congo", "Roumanie", "Royaume-Uni", "Rwanda", "Sénégal", 
    "Serbie", "Singapour", "Suisse", "Suède", "Tanzanie", "Tchad", "Thaïlande", "Tunisie", "Turquie", "Ukraine", "Venezuela", "Vietnam", 
    "Zambie", "Zimbabwe"
];

/* ==========================================================
   INITIALISATION
========================================================== */

const ForgeController = {

    init() {
        this.chargerPays();

        document.getElementById("btnForge")?.addEventListener("click", () => this.forge());
        document.getElementById("btnReset")?.addEventListener("click", () => this.reset());
        document.getElementById("visuel")?.addEventListener("change", e => this.previewImage(e));
        document.getElementById("pays_origine")?.addEventListener("change", e => this.gestionPays(e.target.value));
        document.getElementById("pays_origine")?.addEventListener("keyup", e => this.gestionPays(e.target.value));
        document.getElementById("btnPNG")?.addEventListener("click", () => this.exportPNG());

        console.log("Forge ANOR opérationnelle");
    },

    chargerPays() {
        const liste = document.getElementById("listePays");
        if (!liste) return;
        liste.innerHTML = "";
        PAYS_MONDE.forEach(pays => {
            const option = document.createElement("option");
            option.value = pays;
            liste.appendChild(option);
        });
    },

    gestionPays(pays) {
        const cameroun = document.getElementById("cameroonFields");
        const international = document.getElementById("internationalFields");
        if (!cameroun || !international) return;

        pays = pays.trim();
        if (pays.toLowerCase() === "cameroun") {
            cameroun.style.display = "block";
            international.style.display = "none";
        } else if (pays.length > 0) {
            cameroun.style.display = "none";
            international.style.display = "block";
        } else {
            cameroun.style.display = "none";
            international.style.display = "none";
        }
    },

    /* ==========================================================
       GÉNÉRATION SCEAU
    ========================================================== */
    forge() {
        const produit = document.getElementById("nom_produit").value.trim();
        const producteur = document.getElementById("nom_producteur").value.trim();
        const lot = document.getElementById("lot").value.trim();
        const pays = document.getElementById("pays_origine").value.trim();
        const quantite = document.getElementById("quantite").value.trim();

        if (!produit || !lot || !pays || !quantite) {
            alert("Nom produit, lot, pays et quantité sont obligatoires.");
            return;
        }

        // Signature incluant la quantité pour unicité
        const signature = [produit, producteur, lot, pays, quantite].join("_");

        if (!window.ForgeRenderer) {
            console.error("ForgeRenderer absent");
            alert("Moteur de sceau non chargé");
            return;
        }

        // Rendu SVG via ForgeRenderer
        window.ForgeRenderer.render("seal-container", signature);

        document.getElementById("status").innerText = "SCEAU GÉNÉRÉ";
        document.getElementById("debug").innerText = signature;
    },

    /* ==========================================================
       IMAGE PRODUIT
    ========================================================== */
    /* ==========================================================
   IMAGE PRODUIT
========================================================== */
previewImage(event) {

    const fichier = event.target.files[0];

    if (!fichier) return;

    const img = document.getElementById("previewImg");
    const placeholder = document.getElementById("imagePlaceholder");

    const reader = new FileReader();

    reader.onload = function(e){

        img.src = e.target.result;

        img.onload = function(){

            img.style.display = "block";

            img.style.visibility = "visible";

            img.style.width = "100%";

            img.style.height = "100%";

            img.style.objectFit = "contain";

            if(placeholder)
                placeholder.style.display = "none";

        };

    };

    reader.readAsDataURL(fichier);

}

    /* ==========================================================
       RESET
    ========================================================== */
    reset() {
        document.getElementById("forgeForm").reset();
        const seal = document.getElementById("seal-container");
        if (seal) seal.innerHTML = "";

        const img = document.getElementById("previewImg");
        if (img) {
            img.src = "";
            img.style.display = "none";
        }

        const placeholder = document.getElementById("imagePlaceholder");
        if (placeholder) placeholder.style.display = "block";
        document.getElementById("status").innerText = "PRÊT";
        document.getElementById("debug").innerText = "-";
        this.gestionPays("");
    },

    /* ==========================================================
       EXPORT PNG
    ========================================================== */
    exportPNG() {
        const element = document.querySelector("#seal-container svg");
        if (!element) {
            alert("Aucun sceau à exporter");
            return;
        }
        alert("Export PNG disponible via le moteur de conversion SVG vers Canvas.");
    }
};

document.addEventListener("DOMContentLoaded", () => ForgeController.init());