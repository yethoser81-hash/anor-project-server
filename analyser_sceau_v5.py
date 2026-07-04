"""
==========================================================
analyser_sceau.py
ANOR V7 - VISION IA INDUSTRIELLE STABLE
==========================================================
"""

import math
from collections import defaultdict


# ==========================================================
# CENTROÏDE
# ==========================================================

def compute_centroid(elements):
    if not elements:
        return (0.0, 0.0)

    sx = sum(e.get("x", 0.0) for e in elements)
    sy = sum(e.get("y", 0.0) for e in elements)

    n = len(elements)
    return (sx / n, sy / n)


# ==========================================================
# NORMALISATION CENTRÉE
# ==========================================================

def normalize(elements, cx, cy):
    return [
        {**e, "x": e.get("x", 0.0) - cx, "y": e.get("y", 0.0) - cy}
        for e in elements
    ]


# ==========================================================
# BOUNDS (SYNC RENDERER)
# ==========================================================

def compute_bounds(elements):
    if not elements:
        return (0.0, 0.0, 0.0, 0.0)

    xs, ys = [], []

    for e in elements:
        x, y = e.get("x", 0.0), e.get("y", 0.0)
        size = e.get("taille", e.get("largeur", 0.0))

        xs += [x - size, x + size]
        ys += [y - size, y + size]

    return min(xs), max(xs), min(ys), max(ys)


# ==========================================================
# GLYPHE IA CORE
# ==========================================================

def analyze_glyphe(glyphe):

    elements = glyphe.get("elements", [])

    cx, cy = compute_centroid(elements)
    norm = normalize(elements, cx, cy)

    xmin, xmax, ymin, ymax = compute_bounds(norm)

    width = max(0.0, xmax - xmin)
    height = max(0.0, ymax - ymin)

    area = max(width * height, 1e-6)

    density = len(elements) / area

    formes = defaultdict(int)

    rot_sum = 0
    rot_count = 0

    for e in norm:
        formes[e.get("forme", "unknown")] += 1

        rot = e.get("rotation")
        if rot is not None:
            rot_sum += rot
            rot_count += 1

    rot_mean = rot_sum / rot_count if rot_count else 0

    rot_var = 0
    for e in norm:
        r = e.get("rotation", 0)
        rot_var += (r - rot_mean) ** 2

    rot_var = rot_var / (rot_count or 1)

    structure_score = 1 / (1 + rot_var)

    return {
        "nom": glyphe.get("nom"),
        "centroid": (cx, cy),
        "width": width,
        "height": height,
        "density": density,
        "structure_score": structure_score,
        "formes": dict(formes)
    }


# ==========================================================
# COURONNE IA (VERSION ALIGNÉE RENDERER)
# ==========================================================

def analyze_couronne(glyphes):

    n = len(glyphes)
    if n == 0:
        return {"error": "couronne vide"}

    centroids = []
    formes_global = defaultdict(int)
    angles = []
    radii = []

    for g in glyphes:
        res = analyze_glyphe(g)
        cx, cy = res["centroid"]
        centroids.append((cx, cy))

        for k, v in res["formes"].items():
            formes_global[k] += v

    gx = sum(c[0] for c in centroids) / n
    gy = sum(c[1] for c in centroids) / n

    for cx, cy in centroids:
        dx = cx - gx
        dy = cy - gy

        angles.append(math.atan2(dy, dx))
        radii.append(math.sqrt(dx * dx + dy * dy))

    mean_r = sum(radii) / n
    var_r = sum((r - mean_r) ** 2 for r in radii) / n

    angle_consistency = 0
    for i in range(len(angles)):
        angle_consistency += abs(angles[i] - (2 * math.pi * i / n))

    angle_score = 1 / (1 + angle_consistency)

    symmetry_score = (1 / (1 + var_r)) * 0.7 + angle_score * 0.3

    return {
        "type": "couronne",
        "glyph_count": n,
        "center": (gx, gy),
        "radius_mean": mean_r,
        "symmetry_score": symmetry_score,
        "formes": dict(formes_global)
    }


# ==========================================================
# ENTRY POINT
# ==========================================================

def analyser_sceau(glyphes, mode="auto"):

    if not glyphes:
        return {"error": "aucun glyphe"}

    if mode == "couronne" or len(glyphes) > 1:
        return analyze_couronne(glyphes)

    return analyze_glyphe(glyphes[0])