"""
==========================================================
comparateur_cryptogeometrique.py
ANOR V10
Moteur final anti-contrefaçon
==========================================================
"""

import math


TOLERANCE_ANGLE = 6          # degrés
TOLERANCE_RAYON = 12         # pixels
TOLERANCE_POSITION = 0       # le numéro de position doit être identique


class ComparateurCryptoGeometrique:


    def __init__(self):
        self.ecarts = []


    def comparer(self, lecture, reference):

        self.ecarts = []


        glyphes_detectes = lecture.get("glyphes", [])

        glyphes_reference = reference.get("glyphes", [])


        if len(glyphes_detectes) != len(glyphes_reference):

            self.ecarts.append(
                {
                    "type":"quantite",
                    "attendu":len(glyphes_reference),
                    "detecte":len(glyphes_detectes)
                }
            )


        correspondances = 0


        longueur = min(
            len(glyphes_detectes),
            len(glyphes_reference)
        )


        for i in range(longueur):

            detecte = glyphes_detectes[i]
            attendu = glyphes_reference[i]

            if detecte["anneau"] != attendu["anneau"]:

                self.ecarts.append({

                    "index": i,

                    "type": "anneau",

                    "attendu": attendu["anneau"],

                    "detecte": detecte["anneau"]

                })

                continue
          
            if detecte["position"] != attendu["position"]:

                self.ecarts.append({

                    "index": i,

                    "type": "position",

                    "attendu": attendu["position"],

                    "detecte": detecte["position"]

                })

                continue

            if detecte["forme"] != attendu["forme"]:

                self.ecarts.append(
                    {
                        "index":i,
                        "type":"forme",
                        "attendu":attendu["forme"],
                        "detecte":detecte["forme"]
                    }
                )

                continue



            if detecte["plein"] != attendu["plein"]:

                self.ecarts.append(
                    {
                        "index":i,
                        "type":"etat",
                        "attendu":attendu["plein"],
                        "detecte":detecte["plein"]
                    }
                )

                continue



            diff_angle = abs(
            detecte["angle"] -
            attendu["angle"]
            )

            if diff_angle > 180:
                diff_angle = 360 - diff_angle

            if diff_angle > TOLERANCE_ANGLE:

                self.ecarts.append(
                    {
                        "index":i,
                        "type":"angle",
                        "difference":diff_angle
                    }
                )

                continue



            diff_rayon = abs(
                detecte["rayon"] -
                attendu["rayon"]
            )


            if diff_rayon > TOLERANCE_RAYON:

                self.ecarts.append(
                    {
                        "index":i,
                        "type":"position",
                        "difference":diff_rayon
                    }
                )

                continue



            correspondances += 1



        total = max(
            len(glyphes_reference),
            1
        )


        score = round(
        (correspondances / total) * 100,
        2
        )

        erreurs = len(self.ecarts)


        return {

            "authentique": score >= 95,

            "score": score,

            "correspondances": correspondances,

            "erreurs": erreurs,

            "details": self.ecarts,

            "niveau": self.niveau(score)

        }



    def niveau(self, score):

        if score >= 98:
            return "CONFORME"

        if score >= 95:
            return "ACCEPTABLE"

        if score >= 80:
            return "SUSPECT"

        return "CONTREFACON_PROBABLE"

if __name__ == "__main__":

    import sys
    import json

    lecture = json.loads(sys.argv[1])

    reference = json.loads(sys.argv[2])

    c = ComparateurCryptoGeometrique()

    resultat = c.comparer(
        lecture,
        reference
    )

    print(
        json.dumps(
            resultat,
            ensure_ascii=False
        )
    )