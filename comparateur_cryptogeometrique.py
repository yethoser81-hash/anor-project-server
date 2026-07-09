"""
==========================================================
comparateur_cryptogeometrique.py
ANOR V10
Moteur final anti-contrefaçon
==========================================================
"""

import math


TOLERANCE_ANGLE = 8
TOLERANCE_RAYON = 15


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


        score = (correspondances / total) * 100



        return {

            "authentique":
                score >= 95,

            "score":
                round(score,2),

            "ecarts":
                self.ecarts,

            "niveau":
                self.niveau(score)

        }



    def niveau(self, score):

        if score >= 98:
            return "CONFORME"

        if score >=95:
            return "ACCEPTABLE"

        if score >=80:
            return "SUSPECT"

        return "CONTREFACON_PROBABLE"