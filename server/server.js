const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer(); // Pour gérer les FormData (fichiers + textes)

app.use(cors());
app.use(express.json());

// Client avec accès total utilisant la variable SUPABASE_KEY configurée sur Render
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY
);

app.post('/api/sceau/enregistrer', upload.fields([
    { name: 'visuel_packaging' },
    { name: 'certificat_file' }
]), async (req, res) => {
    try {
        const { id_produit, signature, metadata_raw } = req.body;
        
        // Génération d'une matrice binaire aléatoire simple (64 bits pour le sceau)
        const matrice_binaire = Array.from({length: 64}, () => Math.random() > 0.5 ? '1' : '0').join('');
        const id_sceau = `SCEAU_${Date.now()}`;

        // Insertion dans la base
        const { error } = await supabase
            .from('sya_sceau')
            .insert([{
                id_sceau: id_sceau,
                id_produit: id_produit,
                signature: signature,
                matrice_binaire: matrice_binaire,
                metadata_raw: JSON.parse(metadata_raw),
                statut: 'VALIDE'
            }]);

        if (error) throw error;

        // Réponse conforme à ce que ton index.html attend
        res.json({
            success: true,
            donnees: {
                id_sceau: id_sceau,
                matrice_binaire: matrice_binaire
            }
        });

    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));