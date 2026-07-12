"""
==========================================================
vision_api.py
ANOR V11 - PYTHON VISION BRIDGE (FASTAPI)
==========================================================
"""

import os
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from vision_decoder import VisionDecoder
from comparateur_cryptogeometrique import ComparateurCryptoGeometrique

app = FastAPI()

# Instance du comparateur
comparateur = ComparateurCryptoGeometrique()

# Dossier temporaire pour le traitement
TEMP_DIR = "temp_scans"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# ==========================================================
# PIPELINE COMPLET (ANOR V11)
# ==========================================================

def run_pipeline(image_path, reference=None):
    decoder = VisionDecoder()
    # Le décodeur traite maintenant directement le chemin du fichier
    lecture = decoder.analyser(image_path)
    
    resultat = {
        "lecture": lecture
    }

    if reference:
        verification = comparateur.comparer(
            lecture,
            reference
        )
        resultat["verification"] = verification

    return resultat

# ==========================================================
# ENDPOINT PRINCIPAL
# ==========================================================

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # Sauvegarde temporaire du fichier reçu pour le décodeur
    file_path = os.path.join(TEMP_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Exécution du pipeline
        result = run_pipeline(file_path)
        
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Nettoyage du fichier temporaire
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)