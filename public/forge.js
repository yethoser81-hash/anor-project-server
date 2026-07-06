/**
 * forge.js - Contrôleur principal de la Forge ANOR
 */

import ForgeRenderer from './forge/forgeRenderer.js';

const ForgeController = {
    init: function() {
        document.getElementById('btnForge').addEventListener('click', () => this.handleForge());
        document.getElementById('btnReset').addEventListener('click', () => this.handleReset());
        document.getElementById('visuel').addEventListener('change', (e) => this.handleImagePreview(e));
        
        // Logique métier : Affichage conditionnel des champs de date selon le pays
        document.getElementById('pays_origine').addEventListener('input', (e) => this.toggleDateFields(e.target.value));
    },

    toggleDateFields: function(pays) {
        const camFields = document.getElementById('cameroonFields');
        const intFields = document.getElementById('internationalFields');
        
        if (pays === "Cameroun") {
            camFields.style.display = "block";
            intFields.style.display = "none";
        } else {
            camFields.style.display = "none";
            intFields.style.display = "block";
        }
    },

    handleForge: function() {
        const nom = document.getElementById('nom_produit').value;
        const lot = document.getElementById('lot').value;
        const pays = document.getElementById('pays_origine').value;
        
        // Récupération des dates selon le contexte
        const dateFabrication = document.getElementById('date_fabrication')?.value || "";
        const dateCertificat = document.getElementById('date_certificat_conformite')?.value || "";

        if (!nom || !lot || !pays) {
            alert("Veuillez remplir le nom, le lot et le pays.");
            return;
        }

        // SIGNATURE MÉTIER : La combinaison qui définit le sceau
        // On ne lie pas la date à la génération pour éviter l'instabilité,
        // mais on inclut les paramètres nécessaires à l'unicité.
        const signature = `${nom}_${lot}_${pays}`;
        
        // On passe les métadonnées au Renderer
        ForgeRenderer.render('seal-container', signature, { pays, dateFabrication, dateCertificat });
        
        document.getElementById('status').innerText = "SCEAU GÉNÉRÉ";
        document.getElementById('debug').innerText = signature;
    },

    handleReset: function() {
        document.getElementById('forgeForm').reset();
        document.getElementById('seal-container').innerHTML = '';
        document.getElementById('previewImg').style.display = 'none';
        document.getElementById('status').innerText = "PRÊT";
    },

    handleImagePreview: function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('previewImg');
                img.src = e.target.result;
                img.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ForgeController.init());