   // we need more methods for graphs, especially for the nodes and edges

   
    //TODO: addParent method

    //TODO: addChild method


     export function render(graphData) {
        if (graphData == null || graphData.size == 0) {
            console.error("No data");
            return;
        }
                
        
        //we actually make the graph, initially empty
        const graph = new dagreD3.graphlib.Graph({}).setGraph({});
            for (const [key, value] of graphData.entries()) {
                // set up a node for each respective entry in the data
                graph.setNode(key, {
                    label: key,
                    edge: value.edges,
                    detail: value.detail
                });
                value.edges.forEach(edge => {
                    graph.setEdge(key, edge, {
                        arrowhead: "normal", //aesthetics behind the arrow in digraph
                        curve: d3.curveBasis,
                        label: " "
                    });
                });
        }

        // now setting up the scene using d3 for the visual

        const svg = d3.select("div#container").select("svg"),
            inner = svg.select("g")

        //TODO: zoom feature
        const zoom = d3.zoom().on("zoom", function(event) {
            inner.attr("transform", event.transform);
        });
        svg.call(zoom);

        //make render obj
        const renderer = new dagreD3.render();
        //run render and use the graph data to draw graph
        renderer(inner, graph)


        //centering the visual

        const initialScale = 0.75;
        svg.call(zoom.transform, d3.zoomIdentity
            .translate((svg.attr("width") - graph.graph().width * initialScale) / 2, 20)
            .scale(initialScale));

        svg.attr('height', g.graph().height * initialScale + 40);
        
        
        //TODO: some click/hover features... somehow
    }

//   module.exports = {
//         render
//     }