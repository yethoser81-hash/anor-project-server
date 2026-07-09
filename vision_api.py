"""
==========================================================
vision_api.py
ANOR V10 - PYTHON VISION BRIDGE (FASTAPI)
==========================================================
"""

from fastapi import FastAPI, File, UploadFile
import numpy as np
import cv2

from vision_decoder import VisionDecoder
from comparateur_cryptogeometrique import ComparateurCryptoGeometrique

app = FastAPI()

# Instance du comparateur
comparateur = ComparateurCryptoGeometrique()

# ==========================================================
# IMAGE → PIPELINE COMPLET
# ==========================================================

def run_pipeline(image, reference=None):
    decoder = VisionDecoder()
    lecture = decoder.analyser(image)
    
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
async def analyze_image(
    file: UploadFile = File(...)
):
    contents = await file.read()
    
    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(
        np_arr,
        cv2.IMREAD_COLOR
    )

    result = run_pipeline(image)

    return result