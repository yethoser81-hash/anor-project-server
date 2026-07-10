"""
==========================================================
vision_decoder.py
ANOR V11
Reconstruiseur géométrique officiel
==========================================================
"""

import cv2
import math
import json
import numpy as np

from dataclasses import dataclass
from typing import List


# ==========================================================
# CONSTANTES
# ==========================================================

TAILLE_REFERENCE = 500

CENTRE_X = 250
CENTRE_Y = 250

RAYON_EXTERIEUR = 210
RAYON_TRANSITION = 170
RAYON_NOYAU = 130

NB_EXTERIEUR = 34
NB_TRANSITION = 28
NB_NOYAU = 22

SURFACE_MIN = 25

ANGLE_COMPLET = math.pi * 2


# ==========================================================
# STRUCTURES
# ==========================================================

@dataclass
class Primitive:

    forme: str
    plein: bool
    x: float
    y: float
    aire: float
    contour: object


# ==========================================================
# MOTEUR
# ==========================================================

class VisionDecoder:

    def __init__(self):

        self.image = None

        self.gray = None

        self.binary = None

        self.centre = None

        self.rayon = None

        self.primitives = []

        self.glyphes = []


# ==========================================================
# CHARGEMENT
# ==========================================================

    def charger(self, image):

        if isinstance(image, str):

            self.image = cv2.imread(image)

        else:

            self.image = image.copy()

        if self.image is None:

            raise RuntimeError("Image introuvable")


# ==========================================================
# PRETRAITEMENT
# ==========================================================

    def pretraitement(self):

        self.gray = cv2.cvtColor(

            self.image,

            cv2.COLOR_BGR2GRAY

        )

        self.gray = cv2.GaussianBlur(

            self.gray,

            (5,5),

            0

        )

        self.gray = cv2.equalizeHist(

            self.gray

        )

        self.binary = cv2.adaptiveThreshold(

            self.gray,

            255,

            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,

            cv2.THRESH_BINARY_INV,

            41,

            5

        )

        kernel = np.ones(

            (3,3),

            np.uint8

        )

        self.binary = cv2.morphologyEx(

            self.binary,

            cv2.MORPH_OPEN,

            kernel

        )

        self.binary = cv2.morphologyEx(

            self.binary,

            cv2.MORPH_CLOSE,

            kernel

        )


# ==========================================================
# DETECTION DISQUE
# ==========================================================

    def detecter_disque(self):

        contours,_ = cv2.findContours(

            self.binary,

            cv2.RETR_EXTERNAL,

            cv2.CHAIN_APPROX_SIMPLE

        )

        meilleur = None

        surface = 0

        for c in contours:

            aire = cv2.contourArea(c)

            if aire < surface:

                continue

            (x,y),r = cv2.minEnclosingCircle(c)

            if r < 80:

                continue

            surface = aire

            meilleur = (x,y,r)

        if meilleur is None:

            raise RuntimeError(

                "Disque non détecté"

            )

        self.centre = (

            float(meilleur[0]),

            float(meilleur[1])

        )

        self.rayon = float(meilleur[2])


# ==========================================================
# EXTRACTION PRIMITIVES
# ==========================================================

    def detecter_primitives(self):

        self.primitives = []

        contours,_ = cv2.findContours(

            self.binary,

            cv2.RETR_EXTERNAL,

            cv2.CHAIN_APPROX_SIMPLE

        )

        for contour in contours:

            aire = cv2.contourArea(

                contour

            )

            if aire < SURFACE_MIN:

                continue

            primitive = self.extraire_primitive(

                contour

            )

            if primitive:

                self.primitives.append(

                    primitive

                )

        return self.primitives

# ==========================================================
# EXTRACTION D'UNE PRIMITIVE
# ==========================================================

    def extraire_primitive(self, contour):

        peri = cv2.arcLength(contour, True)

        if peri == 0:
            return None

        approx = cv2.approxPolyDP(

            contour,

            0.035 * peri,

            True

        )

        M = cv2.moments(contour)

        if M["m00"] == 0:
            return None

        cx = M["m10"] / M["m00"]

        cy = M["m01"] / M["m00"]

        forme = self.reconnaitre_forme(

            contour,

            approx

        )

        if forme == "inconnu":

            return None

        plein = self.est_plein(contour)

        return Primitive(

            forme=forme,

            plein=bool(plein),

            x=float(cx),

            y=float(cy),

            aire=float(cv2.contourArea(contour)),

            contour=contour

        )


# ==========================================================
# RECONNAISSANCE DES FORMES
# ==========================================================

    def reconnaitre_forme(

        self,

        contour,

        approx

    ):

        nb = len(approx)

        aire = cv2.contourArea(contour)

        peri = cv2.arcLength(contour, True)

        if peri == 0:

            return "inconnu"

        circularite = (

            4 *

            math.pi *

            aire

        ) / (

            peri *

            peri

        )

        if circularite > 0.84:

            return "cercle"

        if nb == 3:

            return "triangle"

        if nb == 4:

            rect = cv2.minAreaRect(

                contour

            )

            w = rect[1][0]

            h = rect[1][1]

            if h == 0 or w == 0:

                return "rectangle"

            ratio = max(

                w,

                h

            ) / min(

                w,

                h

            )

            angle = abs(rect[2])

            if ratio < 1.20:

                if angle > 20:

                    return "losange"

                return "carre"

            return "rectangle"

        if nb >= 9:

            return "croix"

        if nb in (5,6):

            x,y,w,h = cv2.boundingRect(

                contour

            )

            if h > w * 2:

                return "barre_verticale"

        return "inconnu"


# ==========================================================
# PLEIN / VIDE
# ==========================================================

    def est_plein(

        self,

        contour

    ):

        masque = np.zeros(

            self.gray.shape,

            np.uint8

        )

        cv2.drawContours(

            masque,

            [contour],

            -1,

            255,

            -1

        )

        pixels = self.gray[

            masque == 255

        ]

        if len(pixels) == 0:

            return False

        moyenne = np.mean(

            pixels

        )

        ecart = np.std(

            pixels

        )

        if moyenne < 145:

            return bool(True)

        if moyenne > 190:

            return bool(False)

        return bool(ecart < 32)

# ==========================================================
# NORMALISATION
# ==========================================================

    def normaliser_primitives(self):

        if self.centre is None:

            raise RuntimeError("Centre absent")

        cx, cy = self.centre

        resultat = []

        for p in self.primitives:

            xn = (p.x - cx) / self.rayon

            yn = (p.y - cy) / self.rayon

            resultat.append(

                Primitive(

                    forme=p.forme,

                    plein=bool(p.plein),

                    x=float(CENTRE_X + xn * 250),

                    y=float(CENTRE_Y + yn * 250),

                    aire=float(p.aire),

                    contour=p.contour

                )

            )

        self.primitives = resultat

        return resultat


# ==========================================================
# COORDONNEES POLAIRES
# ==========================================================

    def coordonnees_polaires(self, x, y):

        dx = x - CENTRE_X

        dy = y - CENTRE_Y

        rayon = math.sqrt(

            dx * dx +

            dy * dy

        )

        angle = math.atan2(

            dy,

            dx

        )

        if angle < 0:

            angle += ANGLE_COMPLET

        return float(angle), float(rayon)


# ==========================================================
# DETERMINATION DE L'ANNEAU
# ==========================================================

    def determiner_anneau(self, rayon):

        candidats = [

            (0, abs(rayon - RAYON_NOYAU)),

            (1, abs(rayon - RAYON_TRANSITION)),

            (2, abs(rayon - RAYON_EXTERIEUR))

        ]

        candidats.sort(

            key=lambda x: x[1]

        )

        return int(candidats[0][0])


# ==========================================================
# POSITION OFFICIELLE DANS L'ANNEAU
# ==========================================================

    def determiner_position(

        self,

        angle,

        anneau

    ):

        if anneau == 2:

            total = NB_EXTERIEUR

        elif anneau == 1:

            total = NB_TRANSITION

        else:

            total = NB_NOYAU

        pas = ANGLE_COMPLET / total

        position = int(

            round(

                angle / pas

            )

        )

        if position >= total:

            position = 0

        return int(position)


# ==========================================================
# RECONSTRUCTION DES 84 GLYPHES
# ==========================================================

    def reconstruire_glyphes(self):

        self.glyphes = []

        for p in self.primitives:

            angle, rayon = self.coordonnees_polaires(

                p.x,

                p.y

            )

            anneau = self.determiner_anneau(

                rayon

            )

            position = self.determiner_position(

                angle,

                anneau

            )

            self.glyphes.append(

                {

                    "forme": p.forme,

                    "plein": bool(p.plein),

                    "anneau": int(anneau),

                    "position": int(position),

                    "angle": float(round(

                        math.degrees(angle),

                        3

                    )),

                    "rayon": float(round(

                        rayon,

                        3

                    )),

                    "x": float(round(

                        p.x,

                        2

                    )),

                    "y": float(round(

                        p.y,

                        2

                    ))

                }

            )

        self.glyphes.sort(

            key=lambda g: (

                g["anneau"],

                g["position"]

            )

        )

        return self.glyphes


# ==========================================================
# RECONSTRUCTION DES POSITIONS MANQUANTES
# ==========================================================

    def completer_glyphes(self):

        attendus = {

            0: NB_NOYAU,

            1: NB_TRANSITION,

            2: NB_EXTERIEUR

        }

        for anneau in [0,1,2]:

            existants = {

                g["position"]: g

                for g in self.glyphes

                if g["anneau"] == anneau

            }

            total = attendus[anneau]

            for position in range(total):

                if position in existants:

                    continue

                self.glyphes.append({

                    "forme": None,

                    "plein": bool(False),

                    "anneau": int(anneau),

                    "position": int(position),

                    "angle": float(round(

                        position *

                        (360/total),

                        3

                    )),

                    "rayon": float({

                        0:RAYON_NOYAU,

                        1:RAYON_TRANSITION,

                        2:RAYON_EXTERIEUR

                    }[anneau]),

                    "x": None,

                    "y": None

                })

        self.glyphes.sort(

            key=lambda g:(

                g["anneau"],

                g["position"]

            )

        )

        return self.glyphes


# ==========================================================
# NETTOYAGE DES DOUBLONS
# ==========================================================

    def supprimer_doublons(self):

        uniques = {}

        for g in self.glyphes:

            cle = (

                g["anneau"],

                g["position"]

            )

            if cle not in uniques:

                uniques[cle] = g

                continue

            precedent = uniques[cle]

            if precedent["forme"] is None:

                uniques[cle] = g

                continue

        self.glyphes = list(

            uniques.values()

        )

        self.glyphes.sort(

            key=lambda g:(

                g["anneau"],

                g["position"]

            )

        )

        return self.glyphes


# ==========================================================
# SIGNATURE GEOMETRIQUE OFFICIELLE
# ==========================================================

    def creer_signature_geometrique(self):

        signature = []

        anneaux = {

            0: [],

            1: [],

            2: []

        }

        for g in self.glyphes:

            anneaux[g["anneau"]].append(g)

        for numero in [2,1,0]:

            anneaux[numero].sort(

                key=lambda x: x["position"]

            )

            for g in anneaux[numero]:

                signature.append(

                    {

                        "forme":g["forme"],

                        "plein":bool(g["plein"]),

                        "anneau":int(g["anneau"]),

                        "position":int(g["position"]),

                        "angle":float(g["angle"]),

                        "rayon":float(g["rayon"])

                    }

                )

        return signature


# ==========================================================
# PIPELINE COMPLET
# ==========================================================

    def analyser(self,image):

        self.charger(image)

        self.pretraitement()

        if cv2.countNonZero(self.binary) < 500:
            raise RuntimeError("Image inexploitable")

        self.detecter_disque()

        self.detecter_primitives()

        self.normaliser_primitives()

        self.reconstruire_glyphes()

        self.supprimer_doublons()

        self.completer_glyphes()

        signature = self.creer_signature_geometrique()

        return {

            "centre":{

                "x":float(round(

                    self.centre[0],

                    2

                )),

                "y":float(round(

                    self.centre[1],

                    2

                ))

            },

            "rayon":float(round(

                self.rayon,

                2

            )),

            "nombre_primitives":int(len(

                self.primitives

            )),

            "qualite": float(round(

                len(self.primitives)/84*100,

                2

            )),

            "glyphes":signature,

            "signature":signature

        }


# ==========================================================
# EXECUTION LIGNE DE COMMANDE
# ==========================================================

if __name__=="__main__":

    import sys

    decoder=VisionDecoder()

    resultat=decoder.analyser(

        sys.argv[1]

    )

    print(

        json.dumps(

            resultat,

            ensure_ascii=False

        )

    )