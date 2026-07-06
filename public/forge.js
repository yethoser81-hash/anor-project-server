/**
 * forge.js - Contrôleur principal de la Forge ANOR
 * Gère les interactions utilisateur, la validation et l'orchestration du rendu.
 */

import ForgeRenderer from './forge/forgeRenderer.js';

const ForgeController = {
    // Initialisation des écouteurs d'événements
    init: function() {
        document.getElementById('btnForge').addEventListener('click', () => this.handleForge());
        document.getElementById('btnReset').addEventListener('click', () => this.handleReset());
        
        // Gestion de l'affichage de l'image sélectionnée
        document.getElementById('visuel').addEventListener('change', (e) => this.handleImagePreview(e));
        
        console.log("Forge ANOR : Système opérationnel.");
    },

    // Action de génération du sceau
    handleForge: function() {
        const nom = document.getElementById('nom_produit').value;
        const lot = document.getElementById('lot').value;
        
        if (!nom || !lot) {
            alert("Veuillez remplir au moins le nom du produit et le lot.");
            return;
        }

        // Utilisation du nom et du lot pour créer une signature unique (clé)
        const signature = `${nom}_${lot}`;
        
        // Appel au renderer
        ForgeRenderer.render('seal-container', signature);
        
        // Mise à jour de l'interface
        document.getElementById('status').innerText = "GÉNÉRÉ";
        document.getElementById('debug').innerText = signature;
    },

    // Réinitialisation du formulaire et de la zone de prévisualisation
    handleReset: function() {
        document.getElementById('forgeForm').reset();
        document.getElementById('seal-container').innerHTML = '';
        document.getElementById('previewImg').style.display = 'none';
        document.getElementById('imagePlaceholder').style.display = 'block';
        document.getElementById('status').innerText = "PRÊT";
        document.getElementById('debug').innerText = "-";
    },

    // Affichage de l'image choisie par l'utilisateur
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

// Lancement du contrôleur au chargement du DOM
document.addEventListener('DOMContentLoaded', () => ForgeController.init());