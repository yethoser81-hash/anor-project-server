/**
 * ==========================================================
 * forge.js
 * ANOR V11 - Synchronisé (Nouvelle Table)
 * Contrôleur interface Forge - Architecture Unifiée
 * ==========================================================
 */

async function calculerHash(texte){
    const encoder = new TextEncoder();
    const data = encoder.encode(texte);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

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

const ForgeController = {

    init() {
        this.chargerPays();
        document.getElementById("btnForge")?.addEventListener("click", () => this.forge());
        document.getElementById("btnReset")?.addEventListener("click", () => this.reset());
        document.getElementById("visuel")?.addEventListener("change", (e) => this.previewImage(e));
        document.getElementById("pays_origine")?.addEventListener("change", e => this.gestionPays(e.target.value));
        document.getElementById("btnPNG")?.addEventListener("click", () => this.exportPNG());
        document.getElementById("btnKit")?.addEventListener("click", () => this.exportKit());
    },

    previewImage(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById("previewImg");
                const placeholder = document.getElementById("imagePlaceholder");
                if (preview) {
                    preview.src = event.target.result;
                    preview.style.display = "block";
                }
                if (placeholder) placeholder.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    },

    chargerPays() {
        const liste = document.getElementById("listePays");
        if (!liste) return;
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

        pays = pays.trim().toLowerCase();
        cameroun.style.display = (pays === "cameroun") ? "block" : "none";
        international.style.display = (pays.length > 0 && pays !== "cameroun") ? "block" : "none";
    },

    async forge() {
        const produit = document.getElementById("nom_produit").value.trim();
        const lot = document.getElementById("lot").value.trim();
        const pays = document.getElementById("pays_origine").value.trim();
        const quantite = document.getElementById("quantite").value.trim();

        if (!produit || !lot || !pays || !quantite) {
            alert("Nom produit, lot, pays et quantité sont obligatoires.");
            return;
        }

        const signature = [produit, document.getElementById("nom_producteur").value.trim(), lot, pays, quantite].join("_");

        if (typeof window.ForgeRenderer !== "undefined") {
            await window.ForgeRenderer.render("seal-container", signature);
        } else {
            alert("Erreur: Moteur Forge introuvable.");
            return;
        }

        document.getElementById("status").innerText = "ENVOI AU SERVEUR...";
        document.getElementById("debug").innerText = signature;
        
        const formData = new FormData(document.getElementById("forgeForm"));
        
        // Nettoyage : suppression des dates vides du FormData pour qu'elles ne soient pas envoyées
        ['date_certificat_conformite', 'date_fabrication', 'date_peremption'].forEach(field => {
            const el = document.getElementById(field);
            if (el && el.value.trim() === "") {
                formData.delete(field);
            }
        });
        
        const svgElement = document.querySelector("#seal-container svg");
        if (svgElement) {
            formData.append("sceau_svg", svgElement.outerHTML);
            formData.append("signature_cle", signature);
        }
        
        try {
            const reponse = await fetch(window.API + "/api/forge", { 
                method: "POST", 
                body: formData 
            });
            
            const resultat = await reponse.json();
            if (!resultat.success) throw new Error(resultat.message || "Erreur lors de l'enregistrement");

            document.getElementById("debug").setAttribute("data-nonce", resultat.identifiant);

            document.getElementById("status").innerText = "FORGE TERMINÉE";
            alert("Produit enregistré avec succès. Identifiant (Nonce) : " + resultat.identifiant);
        } catch (err) {
            console.error(err);
            document.getElementById("status").innerText = "ERREUR";
            alert("Erreur serveur : " + err.message);
        }
    },

    reset() {
        document.getElementById("forgeForm").reset();
        const seal = document.getElementById("seal-container");
        if (seal) seal.innerHTML = "";
        const preview = document.getElementById("previewImg");
        const placeholder = document.getElementById("imagePlaceholder");
        if (preview) preview.style.display = "none";
        if (placeholder) placeholder.style.display = "block";
        document.getElementById("status").innerText = "PRÊT";
        document.getElementById("debug").innerText = "-";
        document.getElementById("debug").removeAttribute("data-nonce");
        this.gestionPays("");
    },

    async exportPNG() {
        const svg = document.querySelector("#seal-container svg");
        if (!svg) return alert("Aucun sceau à exporter.");

        const blob = await this.convertirSVG_PNG(svg);
        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");
        lien.download = `SCEAU_ANOR_${document.getElementById("lot").value.trim() || "EXPORT"}.png`;
        lien.href = url;
        lien.click();
        URL.revokeObjectURL(url);
    },

    async convertirSVG_PNG(svg) {
        return new Promise(resolve => {
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svg);
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = 1000;
                canvas.height = 1000;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, 1000, 1000);
                canvas.toBlob(blob => resolve(blob), "image/png", 1);
            };
            image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
        });
    },

    async exportKit() {
        const lot = document.getElementById("lot").value.trim();
        const quantite = document.getElementById("quantite").value.trim();
        const signature = document.getElementById("debug").innerText;

        if (!lot || !signature) return alert("Veuillez d'abord générer un sceau.");

        document.getElementById("status").innerText = "GÉNÉRATION DU KIT...";

        try {
            const response = await fetch(window.API + "/api/export/kit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature, lot, quantite })
            });

            if (!response.ok) throw new Error("Erreur serveur lors de la génération du kit");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const lien = document.createElement("a");
            lien.href = url;
            lien.download = `KIT_ANOR_${lot}.zip`;
            lien.click();
            URL.revokeObjectURL(url);
            
            document.getElementById("status").innerText = "KIT TÉLÉCHARGÉ";
        } catch (err) {
            console.error(err);
            document.getElementById("status").innerText = "ERREUR EXPORT";
            alert("Erreur lors de l'exportation du kit : " + err.message);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => ForgeController.init());