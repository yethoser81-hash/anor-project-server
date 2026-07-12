"""
==========================================================
comparateur_cryptogeometrique.py
ANOR V11 - Moteur final anti-contrefaçon (Synchronisé)
==========================================================
"""

import sys
import json

# ==========================================================
# CONSTANTES DE TOLERANCE
# ==========================================================
TOLERANCE_ANGLE = 6          # degrés
TOLERANCE_RAYON = 12         # pixels

class ComparateurCryptoGeometrique:

    def __init__(self):
        self.ecarts = []

    def comparer(self, lecture, reference):
        self.ecarts = []

        # Utilisation de la clé "signature" pour le scan et "glyphes" pour la BDD
        glyphes_detectes = lecture.get("signature", [])
        glyphes_reference = reference.get("glyphes", [])

        # Comparaison basée sur la structure unifiée
        correspondances = 0
        longueur = min(len(glyphes_detectes), len(glyphes_reference))

        for i in range(longueur):
            d = glyphes_detectes[i]
            r = glyphes_reference[i]

            # 1. Validation structurelle (Anneau et Position)
            if d["anneau"] != r["anneau"] or d["position"] != r["position"]:
                self.ecarts.append({"index": i, "type": "positionnement", "attendu": (r["anneau"], r["position"]), "detecte": (d["anneau"], d["position"])})
                continue

            # 2. Validation Forme
            if d["forme"] != r["forme"]:
                self.ecarts.append({"index": i, "type": "forme", "attendu": r["forme"], "detecte": d["forme"]})
                continue

            # 3. Validation État (Plein/Vide)
            if d["plein"] != r["plein"]:
                self.ecarts.append({"index": i, "type": "etat", "attendu": r["plein"], "detecte": d["plein"]})
                continue

            # 4. Validation Géométrique (Angle et Rayon)
            diff_angle = abs(d["angle"] - r["angle"])
            if diff_angle > 180: diff_angle = 360 - diff_angle
            if diff_angle > TOLERANCE_ANGLE:
                self.ecarts.append({"index": i, "type": "angle", "difference": diff_angle})
                continue

            diff_rayon = abs(d["rayon"] - r["rayon"])
            if diff_rayon > TOLERANCE_RAYON:
                self.ecarts.append({"index": i, "type": "rayon", "difference": diff_rayon})
                continue

            correspondances += 1

        total = max(len(glyphes_reference), 1)
        score = round((correspondances / total) * 100, 2)

        return {
            "authentique": score >= 95,
            "score": score,
            "correspondances": correspondances,
            "erreurs": len(self.ecarts),
            "details": self.ecarts,
            "niveau": self.niveau(score)
        }

    def niveau(self, score):
        if score >= 98: return "CONFORME"
        if score >= 95: return "ACCEPTABLE"
        if score >= 80: return "SUSPECT"
        return "CONTREFACON_PROBABLE"

if __name__ == "__main__":
    # Lecture des entrées JSON depuis la ligne de commande
    try:
        lecture = json.loads(sys.argv[1])
        reference = json.loads(sys.argv[2])
        c = ComparateurCryptoGeometrique()
        print(json.dumps(c.comparer(lecture, reference), ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))