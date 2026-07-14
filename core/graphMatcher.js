/**
 * ==========================================================
 * core/graphMatcher.js
 * ==========================================================
 */

class GraphMatcher{

    comparer(scan,reference){

        let total=0;

        let matches=0;

        for(const noeudRef of reference){

            const noeudScan=

                scan.find(n=>

                    n.glyphe.anneau===noeudRef.glyphe.anneau &&

                    n.glyphe.position===noeudRef.glyphe.position

                );

            if(!noeudScan)
                continue;

            matches++;

            total+=
                this.scoreVoisins(

                    noeudScan.voisins,

                    noeudRef.voisins

                );

        }

        return{

            score:

                matches===0

                ?0

                :Number(

                    (

                        total/

                        matches

                    ).toFixed(2)

                )

        };

    }

    scoreVoisins(scan,ref){

        let s=0;

        for(const v of ref){

            const existe=

                scan.find(x=>

                    x.forme===v.forme &&

                    x.plein===v.plein &&

                    x.anneau===v.anneau

                );

            if(existe)
                s++;

        }

        return

            (s/ref.length)*100;

    }

}

module.exports=
GraphMatcher;