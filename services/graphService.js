const GraphBuilder =
require("../core/graphBuilder");

const GraphMatcher =
require("../core/graphMatcher");

class GraphService{

    constructor(){

        this.builder=
            new GraphBuilder();

        this.matcher=
            new GraphMatcher();

    }

    comparer(scanGlyphes,refGlyphes){

        const graphScan=

            this.builder
            .construire(scanGlyphes);

        const graphRef=

            this.builder
            .construire(refGlyphes);

        return this.matcher.comparer(

            graphScan,

            graphRef

        );

    }

}

module.exports=
new GraphService();