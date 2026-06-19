import sys
import json
import cv2
import numpy as np

def extraire_signature_ia(image_path):
    try:
        # 1. Lecture de l'image en niveaux de gris
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {"success": False, "message": "Impossible de lire l'image."}

        # 2. Normalisation et Redimensionnement standard de travail
        img_resized = cv2.resize(img, (1000, 1000), interpolation=cv2.INTER_CUBIC)
        
        # Binarisation adaptative pour contrer les ombres et reflets sur l'étiquette
        thresh = cv2.adaptiveThreshold(
            img_resized, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )

        # 3. ALIGNEMENT INTELLIGENT : Détection du centre de masse par contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {"success": False, "message": "Aucun contour détecté sur le sceau."}
            
        # Trouver le plus grand contour circulaire (qui correspond à la bordure externe du sceau)
        grand_contour = max(contours, key=cv2.contourArea)
        M = cv2.moments(grand_contour)
        
        if M["m00"] != 0:
            cX = int(M["m10"] / M["m00"])
            cY = int(M["m01"] / M["m00"])
        else:
            cX, cY = 500, 500 # Valeur de secours si parfait au milieu

        # 4. RECONSTRUCTION ET CORRECTION D'ORIENTATION
        # Pour ce prototype industriel, on se recalibre sur le centre de masse détecté (cX, cY)
        # On peut affiner l'angle d'orientation en cherchant l'asymétrie des marqueurs du logo NC
        
        config_rayons = [
            {"key": "noyau", "rayon": 260, "count": 20},
            {"key": "transition", "rayon": 360, "count": 30},
            {"key": "peripherie", "rayon": 440, "count": 40}
        ]

        segments_extraits = {}

        for config in config_rayons:
            chaine_bits = ""
            for i in range(config["count"]):
                # Calcul de l'angle d'échantillonnage
                angle = (i / config["count"]) * np.pi * 2
                
                # Coordonnées dynamiques adaptées au centre réel détecté par l'IA
                x = int(cX + np.cos(angle) * config["rayon"])
                y = int(cY + np.sin(angle) * config["rayon"])

                # Sécurité pour rester dans les limites de l'image 1000x1000
                x = max(0, min(999, x))
                y = max(0, min(999, y))

                # Analyse de la densité locale de la forme (voisinage 3x3)
                zone = thresh[max(0, y-1):min(1000, y+2), max(0, x-1):min(1000, x+2)]
                valeur_moyenne = np.mean(zone)

                # Si la zone est majoritairement blanche sur l'image inversée (donc noire à l'origine)
                chaine_bits += "1" if valeur_moyenne > 127 else "0"
                
            segments_extraits[config["key"]] = chaine_bits

        return {
            "success": True,
            "noyau": segments_extraits["noyau"],
            "transition": segments_extraits["transition"],
            "peripherie": segments_extraits["peripherie"]
        }

    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "Chemin de l'image manquant."}))
        sys.exit(1)

    chemin_image = sys.argv[1]
    resultat = extraire_signature_ia(chemin_image)
    # On renvoie le résultat au format JSON strict pour que Node.js le lise
    print(json.dumps(resultat))