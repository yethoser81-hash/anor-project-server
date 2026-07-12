"""
==========================================================
vision_decoder.py
ANOR V11 - Reconstructeur géométrique officiel
==========================================================
"""

import cv2
import math
import json
import numpy as np
import sys
from dataclasses import dataclass

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

@dataclass
class Primitive:
    forme: str
    plein: bool
    x: float
    y: float
    aire: float
    contour: object

class VisionDecoder:
    def __init__(self):
        self.image = None
        self.gray = None
        self.binary = None
        self.centre = None
        self.rayon = None
        self.primitives = []
        self.glyphes = []

    def charger(self, image_path):
        self.image = cv2.imread(image_path)
        if self.image is None:
            raise RuntimeError("Image introuvable")

    def pretraitement(self):
        self.gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        self.gray = cv2.GaussianBlur(self.gray, (5, 5), 0)
        self.gray = cv2.equalizeHist(self.gray)
        self.binary = cv2.adaptiveThreshold(
            self.gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 41, 5
        )
        kernel = np.ones((3, 3), np.uint8)
        self.binary = cv2.morphologyEx(self.binary, cv2.MORPH_OPEN, kernel)
        self.binary = cv2.morphologyEx(self.binary, cv2.MORPH_CLOSE, kernel)

    def detecter_disque(self):
        contours, _ = cv2.findContours(self.binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        meilleur = None
        surface = 0
        for c in contours:
            aire = cv2.contourArea(c)
            if aire < 5000: continue
            (x, y), r = cv2.minEnclosingCircle(c)
            if r < 80: continue
            if aire > surface:
                surface = aire
                meilleur = (x, y, r)
        
        if meilleur is None:
            raise RuntimeError("Disque non détecté")
        self.centre = (float(meilleur[0]), float(meilleur[1]))
        self.rayon = float(meilleur[2])

    def detecter_primitives(self):
        self.primitives = []
        contours, _ = cv2.findContours(self.binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            if cv2.contourArea(contour) < SURFACE_MIN: continue
            p = self.extraire_primitive(contour)
            if p: self.primitives.append(p)
        return self.primitives

    def extraire_primitive(self, contour):
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.035 * peri, True)
        M = cv2.moments(contour)
        if M["m00"] == 0: return None
        
        forme = self.reconnaitre_forme(contour, approx)
        if forme == "inconnu": return None
        
        return Primitive(
            forme=forme,
            plein=self.est_plein(contour),
            x=M["m10"] / M["m00"],
            y=M["m01"] / M["m00"],
            aire=cv2.contourArea(contour),
            contour=contour
        )

    def reconnaitre_forme(self, contour, approx):
        nb = len(approx)
        aire = cv2.contourArea(contour)
        peri = cv2.arcLength(contour, True)
        if peri == 0: return "inconnu"
        
        circularite = (4 * math.pi * aire) / (peri * peri)
        if circularite > 0.84: return "cercle"
        if nb == 3: return "triangle"
        if nb == 4:
            x, y, w, h = cv2.boundingRect(contour)
            ratio = max(w, h) / min(w, h)
            return "carre" if ratio < 1.2 else "rectangle"
        if nb >= 9: return "croix"
        return "inconnu"

    def est_plein(self, contour):
        masque = np.zeros(self.gray.shape, np.uint8)
        cv2.drawContours(masque, [contour], -1, 255, -1)
        pixels = self.gray[masque == 255]
        return bool(np.mean(pixels) < 145)

    def normaliser_primitives(self):
        cx, cy = self.centre
        self.primitives = [Primitive(
            p.forme, p.plein,
            (p.x - cx) / self.rayon * 250 + CENTRE_X,
            (p.y - cy) / self.rayon * 250 + CENTRE_Y,
            p.aire, p.contour
        ) for p in self.primitives]

    def reconstruire_glyphes(self):
        self.glyphes = []
        # Rayons et densités identiques au compositeur.js
        rayons_ref = [210, 165, 120]
        densites = [34, 28, 22]

        for p in self.primitives:
            dx, dy = p.x - CENTRE_X, p.y - CENTRE_Y
            rayon_detecte = math.sqrt(dx*dx + dy*dy)
            # Conversion en degrés pour correspondre au compositeur.js
            angle_deg = (math.degrees(math.atan2(dy, dx)) + 360) % 360
            
            # Identifier l'anneau (0=Extérieur, 1=Transition, 2=Noyau)
            # On cherche le rayon le plus proche dans notre liste de référence
            distances = [abs(rayon_detecte - r) for r in rayons_ref]
            anneau = distances.index(min(distances))
            
            # Calculer la position (index) basée sur le pas angulaire du compositeur
            nb = densites[anneau]
            pas_angulaire = 360 / nb
            position = int(round(angle_deg / pas_angulaire)) % nb
            
            self.glyphes.append({
                "forme": p.forme, 
                "plein": p.plein,
                "anneau": anneau, 
                "position": position,
                "angle": round(angle_deg, 2), 
                "rayon": round(rayon_detecte, 2)
            })

    def analyser(self, image_path):
        try:
            self.charger(image_path)
            self.pretraitement()
            self.detecter_disque()
            self.detecter_primitives()
            self.normaliser_primitives()
            self.reconstruire_glyphes()
            
            return {
                "success": True,
                "sceau_detecte": True,
                "signature": self.glyphes
            }
        except Exception as e:
            return {"success": False, "message": str(e)}

if __name__ == "__main__":
    decoder = VisionDecoder()
    resultat = decoder.analyser(sys.argv[1])
    print(json.dumps(resultat, ensure_ascii=False))