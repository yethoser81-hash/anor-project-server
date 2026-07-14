/**
 * ==========================================================
 * core/toleranceEngine.js
 * ANOR V18
 * Tolérance aux défauts
 * ==========================================================
 */

class ToleranceEngine{

    filtrer(scan,reference){

        const resultat=[];

        for(const ref of reference){

            const g = scan.find(x=>

                x.anneau===ref.anneau &&

                x.position===ref.position

            );

            if(g){

                resultat.push(g);

                continue;

            }

            resultat.push({

                absent:true,

                ...ref

            });

        }

        return resultat;

    }

    penalite(g){

        if(!g.absent)
            return 0;

        switch(g.anneau){

            case 0:
                return 2;

            case 1:
                return 1;

            case 2:
                return 0.5;

            default:
                return 1;

        }

    }

}

module.exports =
ToleranceEngine;