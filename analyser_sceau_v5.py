import cv2
import numpy as np
import sys
import json
import math

def get_shape_info(contour):
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour, True)
    if perimeter == 0: return "inconnu", False
    
    circularity = 4 * math.pi * (area / (perimeter * perimeter))
    approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
    n = len(approx)
    
    # Classification robuste
    if circularity > 0.85: return "circle", (area > 500)
    if n == 3: return "triangle", True
    if n == 4: 
        x, y, w, h = cv2.boundingRect(approx)
        ratio = float(w)/h
        if 0.9 <= ratio <= 1.1: return "square", True
        return "rect", True
    # Gestion des formes complexes (Croix/Barres)
    if n > 6: return "plus", False
    if n > 4: return "bar", True
    return "inconnu", False

def analyser_image(image_path):
    img = cv2.imread(image_path)
    if img is None: raise Exception("Image non chargée")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Egalisation pour robustesse mobile
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)
    
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Calcul du centre global pour le tri spatial
    all_points = np.vstack(contours) if contours else np.array([])
    if len(all_points) == 0: return []
    M_global = cv2.moments(all_points)
    gx = int(M_global["m10"] / M_global["m00"]) if M_global["m00"] != 0 else 0
    gy = int(M_global["m01"] / M_global["m00"]) if M_global["m00"] != 0 else 0
    
    results = []
    for c in contours:
        if cv2.contourArea(c) < 50: continue
        
        forme, est_plein = get_shape_info(c)
        if forme != "inconnu":
            M = cv2.moments(c)
            cx = int(M["m10"] / M["m00"]) if M["m00"] != 0 else 0
            cy = int(M["m01"] / M["m00"]) if M["m00"] != 0 else 0
            
            # Distance par rapport au centre pour définir la zone (Noyau/Transition/Périphérie)
            dist = math.sqrt((cx - gx)**2 + (cy - gy)**2)
            
            results.append({
                "forme": forme,
                "plein": est_plein,
                "x": cx, "y": cy,
                "dist": dist
            })
            
    # Tri par distance : garantit l'ordre Noyau -> Transition -> Périphérie
    return sorted(results, key=lambda k: k['dist'])

if __name__ == "__main__":
    try:
        data = analyser_image(sys.argv[1])
        print(json.dumps(data))
    except Exception as e:
        print(json.dumps({"error": str(e)}))