"""
==========================================================
glyph_detector.py
ANOR V7 - MATCH ENGINE V2 (ROBUST / MOBILE READY)
==========================================================
"""

import math
from forge import bibliotheque_glyphes as G


# ==========================================================
# NORMALISATION CENTRÉE + SCALE NORMALISATION
# ==========================================================

def normalize_elements(elements):
    if not elements:
        return []

    cx = sum(e.get("x", 0.0) for e in elements) / len(elements)
    cy = sum(e.get("y", 0.0) for e in elements) / len(elements)

    norm = []
    for e in elements:
        norm.append({
            **e,
            "x": e.get("x", 0.0) - cx,
            "y": e.get("y", 0.0) - cy
        })

    # SCALE NORMALISATION (clé mobile)
    max_dist = max(
        math.sqrt(e["x"]**2 + e["y"]**2) for e in norm
    ) or 1.0

    for e in norm:
        e["x"] /= max_dist
        e["y"] /= max_dist

    return norm


# ==========================================================
# DISTANCE NORMALISÉE (robuste rotation + scale)
# ==========================================================

def element_distance(a, b):

    if a.get("forme") != b.get("forme"):
        return 1.0

    dx = a.get("x", 0.0) - b.get("x", 0.0)
    dy = a.get("y", 0.0) - b.get("y", 0.0)

    pos = math.sqrt(dx * dx + dy * dy)

    size_a = a.get("taille", a.get("largeur", 1.0))
    size_b = b.get("taille", b.get("largeur", 1.0))

    size_diff = abs(size_a - size_b)

    # NORMALISATION SOFT (important)
    return min(1.0, (pos * 0.7 + size_diff * 0.3))


# ==========================================================
# MATCHING PROBABILISTE (soft assignment)
# ==========================================================

def match_glyphe(input_elements, glyph):

    ref = glyph.get("elements", [])

    if not ref or not input_elements:
        return 0.0

    used = set()
    total_score = 0.0

    for ie in input_elements:

        best_score = 0.0
        best_index = None

        for i, re in enumerate(ref):

            if i in used:
                continue

            d = element_distance(ie, re)

            # conversion distance → score probabiliste
            score = max(0.0, 1.0 - d)

            if score > best_score:
                best_score = score
                best_index = i

        if best_index is not None:
            used.add(best_index)
            total_score += best_score

    # normalisation finale
    return (total_score / len(ref)) * 100.0


# ==========================================================
# DETECTION PRINCIPALE (ROBUSTE)
# ==========================================================

def detect_glyph(input_elements):

    if not input_elements:
        return {"error": "no input"}

    norm = normalize_elements(input_elements)

    best = None
    best_score = -1

    for g in G:

        score = match_glyphe(norm, g)

        # BONUS STRUCTURE (stabilité IA)
        score *= (0.95 + 0.05 * len(g["elements"]) / 5)

        if score > best_score:
            best_score = score
            best = g

    if not best:
        return {"error": "no match"}

    return {
        "nom": best["nom"],
        "score": round(best_score, 2),
        "elements": best["elements"]
    }


# ==========================================================
# ENTRY
# ==========================================================

if __name__ == "__main__":
    print("glyph_detector V7 - MATCH ENGINE V2 actif")