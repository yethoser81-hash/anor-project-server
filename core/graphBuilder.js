/**
 * ==========================================================
 * core/graphBuilder.js
 * ANOR V16
 * Construction du graphe géométrique
 * ==========================================================
 */

class GraphBuilder {

    construire(glyphes){

        if(!Array.isArray(glyphes))
            return [];

        const graph=[];

        for(const g of glyphes){

            const voisins=
                this.voisins(g,glyphes);

            graph.push({

                glyphe:g,

                voisins

            });

        }

        return graph;

    }

    voisins(g,liste){

        return liste

            .filter(x=>x!==g)

            .map(x=>{

                const dx=x.position-g.position;

                const dr=x.rayon-g.rayon;

                const da=x.angle-g.angle;

                const distance=
                    Math.sqrt(
                        dx*dx+
                        dr*dr
                    );

                return{

                    forme:x.forme,

                    plein:x.plein,

                    anneau:x.anneau,

                    distance,

                    angle:da

                };

            })

            .sort(
                (a,b)=>
                a.distance-b.distance
            )

            .slice(0,6);

    }

}

module.exports=
GraphBuilder;