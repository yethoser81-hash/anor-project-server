import sys
import json
import cv2
import numpy as np
import hashlib

# =========================
# BIBLIOTHEQUE DE FORMES (miroir JS)
# =========================
BIBLIOTHEQUE_FORMES = {
    0: {"nom": "cercle", "valeur": 10},
    1: {"nom": "carre", "valeur": 20},
    2: {"nom": "rectangle", "valeur": 30},
    3: {"nom": "triangle", "valeur": 40},
    4: {"nom": "losange", "valeur": 50},
    5: {"nom": "croix", "valeur": 60},
    6: {"nom": "demi_cercle", "valeur": 70},
    7: {"nom": "barre_verticale", "valeur": 80}
}

SEED = 3 # 🔒 verrouillage système

def hash_bits(bits):
    return hashlib.sha256(bits.encode()).hexdigest()

# =========================
# IA EXTRACTION
# =========================
def extraire_signature_ia(image_path):
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {"success": False, "message": "Impossible de lire l'image."}

        # Cinquième correction : redimensionnement haute précision
        TARGET_SIZE = 1400
        img = cv2.resize(img, (TARGET_SIZE, TARGET_SIZE), interpolation=cv2.INTER_LANCZOS4)

        # Sixième correction : ajout du nettoyage morphologique
        _, thresh = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        kernel = np.ones((3,3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return {"success": False, "message": "Aucun contour détecté."}

        grand_contour = max(contours, key=cv2.contourArea)
        M = cv2.moments(grand_contour)

        if M["m00"] != 0:
            cX = int(M["m10"] / M["m00"])
            cY = int(M["m01"] / M["m00"])
        else:
            cX, cY = TARGET_SIZE // 2, TARGET_SIZE // 2

        config_rayons = [
            {"key": "noyau", "rayon": 350, "count": 20, "decalage": 0},
            {"key": "transition", "rayon": 450, "count": 30, "decalage": 0.05},
            {"key": "peripherie", "rayon": 550, "count": 40, "decalage": 0.1}
        ]

        segments = {}
        formes_hash = {}

        # =========================
        # EXTRACTION + LECTURE FORMES
        # =========================
        for config in config_rayons:
            bits = []
            formes = []

            for i in range(config["count"]):
                angle = ((i / config["count"]) * np.pi * 2) + config["decalage"]

                x = int(cX + np.cos(angle) * config["rayon"])
                y = int(cY + np.sin(angle) * config["rayon"])

                x = max(0, min(TARGET_SIZE - 1, x))
                y = max(0, min(TARGET_SIZE - 1, y))

                # Troisième correction : zone de lecture 13x13 pour la robustesse
                zone = thresh[
                    max(0, y-6):min(TARGET_SIZE, y+7),
                    max(0, x-6):min(TARGET_SIZE, x+7)
                ]

                # Quatrième correction : mesure de densité de pixels
                val = np.count_nonzero(zone) / zone.size
                bit = 1 if val > 0.45 else 0
                bits.append(str(bit))

                # =========================
                # MAPPING VERROUILLÉ (SEED + i + bit)
                # =========================
                index_forme = (i + bit + SEED) % 8
                forme = BIBLIOTHEQUE_FORMES[index_forme]

                formes.append({
                    "position": i,
                    "bit": bit,
                    "forme": forme["nom"],
                    "valeur": forme["valeur"]
                })

            bits_str = "".join(bits)
            segments[config["key"]] = {
                "bits": bits_str,
                "formes": formes
            }
            formes_hash[config["key"]] = hash_bits(bits_str)

        return {
            "success": True,
            "noyau": segments["noyau"]["bits"],
            "transition": segments["transition"]["bits"],
            "peripherie": segments["peripherie"]["bits"],
            "formes": segments,
            "formes_hash": formes_hash
        }

    except Exception as e:
        return {"success": False, "message": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "Chemin image manquant"}))
        sys.exit(1)

    result = extraire_signature_ia(sys.argv[1])
    print(json.dumps(result))