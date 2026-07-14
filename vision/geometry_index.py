"""
====================================================
ANOR V13
geometry_index.py
Construction d'un index géométrique stable
====================================================
"""

import hashlib


def build(glyphes):

    if glyphes is None:
        return None

    morceaux = []

    glyphes = sorted(
        glyphes,
        key=lambda g: (
            g["anneau"],
            g["position"]
        )
    )

    for g in glyphes:

        morceaux.append(

            "{}:{}:{}:{}".format(

                g["anneau"],
                g["position"],
                g["forme"],
                1 if g["plein"] else 0

            )

        )

    chaine = "|".join(morceaux)

    sha = hashlib.sha256(
        chaine.encode("utf8")
    ).hexdigest()

    return {

        "hash": sha,

        "prefix16": sha[:16],

        "prefix24": sha[:24],

        "nbGlyphes": len(glyphes)

    }