"""
==========================================================
vision_api.py
ANOR V7 - PYTHON VISION BRIDGE (FASTAPI)
==========================================================
"""

from fastapi import FastAPI, File, UploadFile
import numpy as np
import cv2

from detect_shapes import detect_shapes
from glyph_detector import detect_glyph
from analyser_sceau import analyser_sceau

app = FastAPI()


# ==========================================================
# IMAGE → PIPELINE COMPLET
# ==========================================================

def run_pipeline(image):
    shapes = detect_shapes(image)

    glyph = detect_glyph(shapes)

    seal_analysis = analyser_sceau([glyph] if glyph else [])

    return {
        "primitives": shapes,
        "glyph": glyph,
        "seal": seal_analysis
    }


# ==========================================================
# ENDPOINT PRINCIPAL
# ==========================================================

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):

    contents = await file.read()

    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    result = run_pipeline(image)

    return result