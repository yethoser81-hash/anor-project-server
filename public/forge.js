/**
 * forge.js - ANOR V10 - Contrôleur complet et corrigé
 */

import ForgeRenderer from './forge/forgeRenderer.js';

const ForgeController = {
    init: function() {
        document.getElementById('btnForge').addEventListener('click', () => this.handleForge());
        document.getElementById('btnReset').addEventListener('click', () => this.handleReset());
        document.getElementById('visuel').addEventListener('change', (e) => this.handleImagePreview(e));
        
        // Utilisation de l'événement 'change' ou 'blur' pour capturer la sélection dans la datalist
        const paysInput = document.getElementById('pays_origine');
        paysInput.addEventListener('change', (e) => this.toggleDateFields(e.target.value));
        paysInput.addEventListener('blur', (e) => this.toggleDateFields(e.target.value));
        
        console.log("Forge ANOR : Système opérationnel.");
    },

    toggleDateFields: function(pays) {
        const camFields = document.getElementById('cameroonFields');
        const intFields = document.getElementById('internationalFields');
        
        // Nettoyage de la saisie
        const val = pays.trim();
        
        // Logique stricte demandée
        if (val === "Cameroun") {
            camFields.style.display = "block";
            intFields.style.display = "none";
        } else if (val !== "") {
            camFields.style.display = "none";
            intFields.style.display = "block";
        } else {
            camFields.style.display = "none";
            intFields.style.display = "none";
        }
    },

    handleForge: function() {
        const nom = document.getElementById('nom_produit').value;
        const lot = document.getElementById('lot').value;
        const pays = document.getElementById('pays_origine').value;
        
        // Récupération dynamique selon la visibilité
        const dateFabrication = document.getElementById('date_fabrication')?.value || "";
        const datePeremption = document.getElementById('date_peremption')?.value || "";
        const dateCertificat = document.getElementById('date_certificat_conformite')?.value || "";

        if (!nom || !lot || !pays) {
            alert("Veuillez remplir le nom, le lot et le pays.");
            return;
        }

        const signature = `${nom}_${lot}_${pays}`;
        
        // Transmission au renderer avec métadonnées complètes
        ForgeRenderer.render('seal-container', signature, { 
            pays, 
            dateFabrication, 
            datePeremption, 
            dateCertificat 
        });
        
        document.getElementById('status').innerText = "SCEAU GÉNÉRÉ";
        document.getElementById('debug').innerText = signature;
    },

    handleReset: function() {
        document.getElementById('forgeForm').reset();
        document.getElementById('seal-container').innerHTML = '';
        document.getElementById('previewImg').style.display = 'none';
        document.getElementById('imagePlaceholder').style.display = 'block';
        document.getElementById('status').innerText = "PRÊT";
        document.getElementById('debug').innerText = "-";
        
        // On force le masquage des champs de date
        document.getElementById('cameroonFields').style.display = 'none';
        document.getElementById('internationalFields').style.display = 'none';
    },

    handleImagePreview: function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('previewImg');
                img.src = e.target.result;
                img.style.display = 'block';
                document.getElementById('imagePlaceholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ForgeController.init());