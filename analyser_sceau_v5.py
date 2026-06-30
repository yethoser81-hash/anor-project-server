import sys
import json
import cv2
import numpy as np
import hashlib
import math

# =========================
# BIBLIOTHEQUE DE FORMES
# =========================
BIBLIOTHEQUE_FORMES = {
    0: "cercle",
    1: "carre",
    2: "rectangle",
    3: "triangle",
    4: "losange",
    5: "croix",
    6: "demi_cercle",
    7: "barre_verticale"
}

SEED = 3


def hash_bits(bits):
    return hashlib.sha256(bits.encode()).hexdigest()

# =========================
# DETECTER FORME (Point 2)
# =========================
def detecter_forme(contour):
    peri = cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
    n = len(approx)
    if n == 3: return "triangle"
    if n == 4:
        x, y, w, h = cv2.boundingRect(approx)
        ratio = w / float(h)
        if 0.90 < ratio < 1.10: return "carre"
        return "rectangle"
    if n == 5: return "losange"
    if n > 6: return "cercle"
    return "forme"

# =========================
# DETECTION ORIENTATION (Point 1)
# =========================
def calcul_orientation(zone):
    orientation = 0.0
    if len(zone) > 5:
        cts, _ = cv2.findContours(zone, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cts:
            c = max(cts, key=cv2.contourArea)
            if len(c) >= 5:
                try:
                    (_, _), (_, _), ang = cv2.fitEllipse(c)
                    orientation = float(ang)
                except:
                    orientation = 0.0
    return orientation

# =========================
# EXTRACTION IA
# =========================
def extraire_signature_ia(image_path):

    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {"success": False, "message": "Image invalide"}

        # normalisation
        TARGET = 1400
        img = cv2.resize(img, (TARGET, TARGET), interpolation=cv2.INTER_LANCZOS4)

        # binarisation propre
        _, thresh = cv2.threshold(
            img, 0, 255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

        kernel = np.ones((3,3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(
            thresh,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            return {"success": False, "message": "Aucun contour détecté"}

        grand = max(contours, key=cv2.contourArea)

        M = cv2.moments(grand)

        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            cx, cy = TARGET//2, TARGET//2

        # =========================
        # ANNEAUX LOGIQUES
        # =========================
        anneaux = [
            {"key": "noyau", "r": 350, "count": 20, "dec": 0},
            {"key": "transition", "r": 450, "count": 30, "dec": 0.05},
            {"key": "peripherie", "r": 550, "count": 40, "dec": 0.1}
        ]

        result = {}
        formes_result = {}

        # =========================
        # EXTRACTION GLOBALE
        # =========================
        for a in anneaux:

            bits = []
            glyphes = []

            for i in range(a["count"]):

                angle = (i / a["count"]) * np.pi * 2 + a["dec"]

                x = int(cx + np.cos(angle) * a["r"])
                y = int(cy + np.sin(angle) * a["r"])

                x = np.clip(x, 10, TARGET-11)
                y = np.clip(y, 10, TARGET-11)

                zone = thresh[y-10:y+11, x-10:x+11]
                densite = np.count_nonzero(zone) / zone.size

                bit = 1 if densite > 0.45 else 0
                bits.append(str(bit))

                # =========================
                # GLYPHE STRUCTURE (Points 1,3,4,5)
                # =========================
                index = (i + bit + SEED) % 8
                nom_forme = BIBLIOTHEQUE_FORMES[index]
                
                # Détection cluster (Point 3)
                cts, _ = cv2.findContours(zone, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
                cluster = len(cts)
                
                # Orientation réelle (Point 1)
                orientation = calcul_orientation(zone)
                
                # Taille/Aire (Point 4)
                aire = cv2.contourArea(max(cts, key=cv2.contourArea)) if cts else 0
                
                # Hash identifiant (Point 5)
                glyphe_hash = hashlib.sha1(
                    (nom_forme + str(round(orientation)) + str(cluster)).encode()
                ).hexdigest()[:12]

                glyphes.append({
                    "index": i,
                    "bit": bit,
                    "forme": nom_forme,
                    "orientation": orientation,
                    "cluster": cluster,
                    "aire": aire,
                    "glyphe_id": glyphe_hash
                })

            bits_str = "".join(bits)
            result[a["key"]] = bits_str
            formes_result[a["key"]] = {
                "bits": bits_str,
                "glyphes": glyphes,
                "hash": hash_bits(bits_str)
            }

        # Score qualité (Point 6)
        qualite = np.count_nonzero(thresh)
        qualite = min(100, round(qualite / 9000 * 100))

        # =========================
        # SORTIE FINALE
        # =========================
        return {
            "success": True,
            "noyau": result["noyau"],
            "transition": result["transition"],
            "peripherie": result["peripherie"],
            "formes": formes_result,
            "glyphes": {
                "noyau": formes_result["noyau"]["glyphes"],
                "transition": formes_result["transition"]["glyphes"],
                "peripherie": formes_result["peripherie"]["glyphes"]
            },
            "lecture": {
                "qualite": qualite,
                "version": "ANOR IA V6"
            }
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "Image manquante"}))
        sys.exit(1)

    res = extraire_signature_ia(sys.argv[1])
    print(json.dumps(res))