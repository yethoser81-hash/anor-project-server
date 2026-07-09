"""
==========================================================
vision_decoder.py
ANOR V10
Moteur principal de reconstruction géométrique du sceau
==========================================================
"""

import cv2
import math
import numpy as np
from dataclasses import dataclass
from typing import List, Optional

# ==========================================================
# CONSTANTES DE LA FORGE
# ==========================================================

TAILLE_REFERENCE = 500
CENTRE_REFERENCE_X = 250
CENTRE_REFERENCE_Y = 250
SURFACE_MIN = 30

RAYONS_FORGE = (210, 170, 130)
DENSITES_FORGE = (34, 28, 22)
TOLERANCE_RAYON = 12
TOLERANCE_ANGLE = 360 / 34 / 2

RAYONS_PAR_ANNEAU = {
    0:130,
    1:170,
    2:210
}

NB_GLYPHES_PAR_ANNEAU = {
    0:22,
    1:28,
    2:34
}

ANGLE_COMPLET = math.pi * 2

# ==========================================================
# STRUCTURES
# ==========================================================

@dataclass
class PrimitiveDetectee:
    forme: str
    plein: bool
    x: float
    y: float
    aire: float
    contour: object

@dataclass
class GlypheReconstruit:
    forme: str
    plein: bool
    angle: float
    rayon: float
    anneau: int
    x: float
    y: float

@dataclass
class SealGeometry:
    centre_x: float
    centre_y: float
    rayon_global: float
    glyphes: List[GlypheReconstruit]

# ==========================================================
# CLASSE PRINCIPALE
# ==========================================================

class VisionDecoder:
    def __init__(self):
        self.image = None
        self.gray = None
        self.binary = None
        self.centre = None
        self.rayon = None
        self.glyphes = []
        self.primitives = []

    def charger(self, image):
        if isinstance(image, str):
            self.image = cv2.imread(image)
        else:
            self.image = image.copy()
        if self.image is None:
            raise RuntimeError("Impossible de charger l'image.")

    def pretraitement(self):
        gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 4)
        kernel = np.ones((3, 3), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        self.gray = gray
        self.binary = binary
        return binary

    def detecter_disque(self):
        contours, _ = cv2.findContours(self.binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        meilleur = None
        meilleure_surface = 0
        for c in contours:
            area = cv2.contourArea(c)
            if area < meilleure_surface:
                continue
            (x, y), rayon = cv2.minEnclosingCircle(c)
            if rayon < 80:
                continue
            meilleure_surface = area
            meilleur = (x, y, rayon)
        if meilleur is None:
            raise RuntimeError("Disque principal introuvable.")
        self.centre = (meilleur[0], meilleur[1])
        self.rayon = meilleur[2]
        return self.centre, self.rayon

    def detecter_primitives(self):
        self.primitives = []
        contours, _ = cv2.findContours(self.binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            aire = cv2.contourArea(contour)
            if aire < SURFACE_MIN:
                continue
            primitive = self.analyser_contour(contour)
            if primitive is not None:
                self.primitives.append(primitive)
        return self.primitives

    def analyser_contour(self, contour):
        perimetre = cv2.arcLength(contour, True)
        if perimetre == 0:
            return None
        approximation = cv2.approxPolyDP(contour, 0.035 * perimetre, True)
        moments = cv2.moments(contour)
        if moments["m00"] == 0:
            return None
        cx = moments["m10"] / moments["m00"]
        cy = moments["m01"] / moments["m00"]
        forme = self.reconnaitre_forme(contour, approximation)
        plein = self.est_plein(contour)
        return PrimitiveDetectee(
            forme=forme,
            plein=plein,
            x=cx,
            y=cy,
            aire=cv2.contourArea(contour),
            contour=contour
        )

    # ==========================================================
    # RECONNAISSANCE DES FORMES
    # ==========================================================

    def reconnaitre_forme(self, contour, approximation):
        sommets = len(approximation)
        aire = cv2.contourArea(contour)
        perimetre = cv2.arcLength(contour, True)
        if perimetre == 0:
            return "inconnu"
        circularite = (4 * math.pi * aire / (perimetre * perimetre))
        if circularite > 0.82:
            return "cercle"
        if sommets == 3:
            return "triangle"
        if sommets == 4:
            x, y, w, h = cv2.boundingRect(approximation)
            ratio = w / float(h)
            if 0.85 <= ratio <= 1.15:
                rect = cv2.minAreaRect(contour)
                angle = abs(rect[2])
                if angle > 15:
                    return "losange"
                return "carre"
            return "rectangle"
        if sommets >= 8:
            return "croix"
        if sommets == 5 or sommets == 6:
            x, y, w, h = cv2.boundingRect(approximation)
            if h > w * 2:
                return "barre_verticale"
        return "inconnu"

    # ==========================================================
    # DETECTION PLEIN / VIDE
    # ==========================================================

    def est_plein(self, contour):
        masque = np.zeros(self.gray.shape, dtype=np.uint8)
        cv2.drawContours(masque, [contour], -1, 255, -1)
        pixels = self.gray[masque == 255]
        if len(pixels) == 0:
            return False
        moyenne = np.mean(pixels)
        return moyenne < 150

    # ==========================================================
    # NORMALISATION FORGE
    # ==========================================================

    def normaliser_primitives(self):
        if not self.centre:
            raise RuntimeError("Centre du sceau absent")
        resultat = []
        cx0, cy0 = self.centre
        for p in self.primitives:
            x = (p.x - cx0) / self.rayon
            y = (p.y - cy0) / self.rayon
            x = CENTRE_REFERENCE_X + x * 250
            y = CENTRE_REFERENCE_Y + y * 250
            resultat.append(
                PrimitiveDetectee(
                    forme=p.forme,
                    plein=p.plein,
                    x=x,
                    y=y,
                    aire=p.aire,
                    contour=p.contour
                )
            )
        self.primitives = resultat
        return resultat

    # ==========================================================
    # TRANSFORMATION PRIMITIVES → GLYPHES
    # ==========================================================

    def coordonnees_polaires(self, x, y):
        cx, cy = CENTRE_REFERENCE_X, CENTRE_REFERENCE_Y
        dx, dy = x - cx, y - cy
        rayon = math.sqrt(dx * dx + dy * dy)
        angle = math.atan2(dy, dx)
        if angle < 0:
            angle += ANGLE_COMPLET
        return angle, rayon

    def determiner_anneau(self, rayon):
        distances = [abs(rayon - r) for r in RAYONS_FORGE]
        return distances.index(min(distances))
    
    def determiner_position(self, angle, anneau):

    total = NB_GLYPHES_PAR_ANNEAU[anneau]

    pas = ANGLE_COMPLET / total

    position = int(round(angle / pas))

    if position >= total:
        position = 0

    return position

    def reconstruire_glyphes(self):
        self.glyphes = []
        for p in self.primitives:
            angle, rayon = self.coordonnees_polaires(p.x, p.y)
            anneau = self.determiner_anneau(rayon)
            if p.forme == "inconnu":
                continue
            position = self.determiner_position(
    angle,
    anneau
)

self.glyphes.append(

    {

        "forme":p.forme,

        "plein":p.plein,

        "angle":angle,

        "rayon":rayon,

        "anneau":anneau,

        "position":position,

        "x":p.x,

        "y":p.y

    }

)
        return self.glyphes

    # ==========================================================
    # CREATION SIGNATURE GEOMETRIQUE
    # ==========================================================

    def creer_signature_geometrique(self):
        anneaux = {0: [], 1: [], 2: []}
        for g in self.glyphes:
            anneaux[g.anneau].append(g)
        resultat = []
        for numero in [2, 1, 0]:
            elements = sorted(anneaux[numero],key=lambda g:g["position"] )
            for g in elements:
                resultat.append({
                    "forme": g.forme,
                    "plein": g.plein,
                    "anneau": numero,
                    "angle": round(math.degrees(g.angle), 2),
                    "rayon": round(g.rayon, 2)
                })
        return resultat

# ==========================================================
# COMPARAISON DES FORMES
# ==========================================================

def comparer_bibliotheque(self, bibliotheque_attendue):

    observes = self.creer_signature_geometrique()

    attendus = []

    for zone in ["noyau", "transition", "peripherie"]:

        if zone in bibliotheque_attendue:

            attendus.extend(
                bibliotheque_attendue[zone]
            )

    erreurs = 0

    total = min(
        len(observes),
        len(attendus)
    )

    if total == 0:

        return {
            "score":0,
            "erreurs":["bibliothèque vide"]
        }

    details=[]

    for i in range(total):

        o = observes[i]
        a = attendus[i]

        ok = True

        if o["forme"] != a["nom"]:
            ok = False

        if o["plein"] != a["est_plein"]:
            ok = False

        if not ok:

            erreurs += 1

            details.append({

                "index":i,

                "attendu":a,

                "observe":o

            })

    score = 100 * (
        total-erreurs
    ) / total

    return {

        "score":round(score,2),

        "erreurs":details

    }

    # ==========================================================
# COMPARAISON DE SIGNATURE
# ==========================================================

def comparer_signature(self,
                       signature_reference):

    signature = self.creer_signature_geometrique()

    if len(signature) != len(signature_reference):

        return {

            "score":0,

            "valide":False

        }

    bonnes = 0

    for a,b in zip(
        signature,
        signature_reference
    ):

        if (

            a["forme"] == b["forme"]

            and

            a["plein"] == b["plein"]

            and

            a["anneau"] == b["anneau"]

        ):

            bonnes += 1

    score = bonnes / len(signature) * 100

    return {

        "score":round(score,2),

        "valide":score > 95

    }

    # ==========================================================
# SCORE GLOBAL
# ==========================================================

def calculer_score(self,
                   score_bibliotheque,
                   score_signature):

    total = (

        score_bibliotheque * 0.70

        +

        score_signature * 0.30

    )

    return round(total,2)

    # ==========================================================
# VERDICT
# ==========================================================

def verifier(self,
             image,
             bibliotheque,
             signature):

    self.analyser(image)

    resultat_biblio = self.comparer_bibliotheque(
        bibliotheque
    )

    resultat_signature = self.comparer_signature(
        signature
    )

    score = self.calculer_score(

        resultat_biblio["score"],

        resultat_signature["score"]

    )

    return {

        "authentique":

            score >= 95,

        "score":

            score,

        "bibliotheque":

            resultat_biblio,

        "signature":

            resultat_signature

    }

    # ==========================================================
    # PIPELINE COMPLETE
    # ==========================================================

    def analyser(self, image):
        self.charger(image)
        self.pretraitement()
        self.detecter_disque()
        self.detecter_primitives()
        self.normaliser_primitives()
        self.reconstruire_glyphes()
        signature = self.creer_signature_geometrique()

return {

    "centre":{

        "x":self.centre[0],

        "y":self.centre[1]

    },

    "rayon":self.rayon,

    "nombre_primitives":len(self.primitives),

    "glyphes":signature,

    "signature":signature

}

if __name__ == "__main__":

    import sys
    import json

    decoder = VisionDecoder()

    resultat = decoder.analyser(sys.argv[1])

    print(
        json.dumps(
            resultat,
            ensure_ascii=False
        )
    )