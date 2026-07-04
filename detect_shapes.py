"""
==========================================================
detect_shapes.py
ANOR V7 - VISION ENGINE V2 (ROBUST MOBILE)
==========================================================
"""

import cv2
import numpy as np
import math


# ==========================================================
# PREPROCESSING ROBUSTE (mobile / bruit / lumière)
# ==========================================================

def preprocess(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    thresh = cv2.adaptiveThreshold(
        blur,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11,
        2
    )

    return thresh


# ==========================================================
# CIRCULARITY (détection cercle fiable)
# ==========================================================

def circularity(contour):
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour, True)

    if perimeter == 0:
        return 0

    return 4 * math.pi * area / (perimeter * perimeter)


# ==========================================================
# CLASSIFICATION FORME
# ==========================================================

def classify_shape(contour):
    approx = cv2.approxPolyDP(contour, 0.04 * cv2.arcLength(contour, True), True)
    vertices = len(approx)

    circ = circularity(contour)

    # CERCLE
    if circ > 0.82:
        return "cercle"

    # TRIANGLE
    if vertices == 3:
        return "triangle"

    # RECTANGLE / CARRE
    if vertices == 4:
        x, y, w, h = cv2.boundingRect(approx)
        ratio = w / float(h)

        if 0.75 <= ratio <= 1.25:
            return "carre"
        else:
            return "rectangle"

    # LOSANGE (heuristique)
    if vertices == 4:
        return "losange"

    # CROIX (heuristique avancée)
    if vertices > 6:
        return "croix"

    return "inconnu"


# ==========================================================
# CENTROÏDE
# ==========================================================

def centroid(contour):
    M = cv2.moments(contour)

    if M["m00"] == 0:
        return 0, 0

    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])

    return cx, cy


# ==========================================================
# TAILLE NORMALISÉE
# ==========================================================

def size_from_contour(contour):
    _, _, w, h = cv2.boundingRect(contour)
    return (w + h) / 4.0


# ==========================================================
# EXTRACTION PRINCIPALE
# ==========================================================

def detect_shapes(image):
    """
    INPUT: image OpenCV (BGR)
    OUTPUT: liste de primitives ANOR V7
    """

    processed = preprocess(image)

    contours, _ = cv2.findContours(
        processed,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    result = []

    for c in contours:
        area = cv2.contourArea(c)

        # filtre bruit (CRITIQUE mobile)
        if area < 30:
            continue

        cx, cy = centroid(c)
        shape = classify_shape(c)
        size = size_from_contour(c)

        result.append({
            "x": float(cx),
            "y": float(cy),
            "forme": shape,
            "taille": float(size),
            "rotation": 0.0,
            "confiance": float(min(1.0, area / 5000.0))
        })

    return result