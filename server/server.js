const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// VÉRIFICATION CRITIQUE : on récupère la clé depuis Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Si la clé est absente, on bloque tout de suite avec un message explicite
if (!supabaseKey) {
    console.error("ERREUR CRITIQUE : La variable SUPABASE_KEY est absente de la configuration Render.");
    process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/api/sceau/enregistrer', upload.fields([
    { name: 'visuel_packaging' },
    { name: 'certificat_file' }
]), async (req, res) => {
    try {
        const { id_produit, signature, metadata_raw } = req.body;
        
        const matrice_binaire = Array.from({length: 64}, () => Math.random() > 0.5 ? '1' : '0').join('');
        const id_sceau = `SCEAU_${Date.now()}`;

        const { error } = await supabase
            .from('sya_sceau')
            .insert([{
                id_sceau: id_sceau,
                id_produit: id_produit,
                signature: signature,
                matrice_binaire: matrice_binaire,
                metadata_raw: typeof metadata_raw === 'string' ? JSON.parse(metadata_raw) : metadata_raw,
                statut: 'VALIDE'
            }]);

        if (error) throw error;

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