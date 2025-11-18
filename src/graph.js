   // we need more methods for graphs, especially for the nodes and edges

   
    //TODO: addParent method

    //TODO: addChild method

   /*
    render takes the graph data and then renders it using d3.

    
   */
     export function render(graphData) {
        if (graphData == null || graphData.size == 0) {
            console.error("No data");
            return;
        }
                
        
        //we actually make the graph, initially empty
        const graph = new dagreD3.graphlib.Graph({}).setGraph({});

        // add all nodes
            for (const [key, value] of graphData.entries()) {
                // set up a node for each respective entry in the data
                graph.setNode(key, {
                    label: `${value.detail.givenName} ${value.detail.familyName} (${value.detail.yearAwarded})`,
                    detail: value.detail
                });
            }

        //gets the edges that we have in the data
        for (const [key, value] of graphData.entries()) {

            //logic to draw the downstream/children

            value.edges.forEach(adviseeId => {

                //we only include the edge if the advisee is in the map, data is limited
                if (graphData.has(adviseeId)) {
                    graph.setEdge(key, adviseeId, {
                        arrowhead: "normal",
                        curve: d3.curveBasis,
                        label: " "
                    });
                }
            });

            value.advisors.forEach(advisorId => {
                if (graphData.has(advisorId)) {
                    graph.setEdge(advisorId, key, {
                        arrowhead: "normal",
                        curve: d3.curveBasis,
                        label: " "
                    });
                }
            });

            // value.edges.forEach(edge => {

            //     //check to see if graph does not have a node
            //     if (!graph.hasNode(edge)) {
            //         //make random node so the edge can at least be there, ideally it would be another node in itself

            //         //MUST CHANGE
            //         graph.setNode(edge, {label: `${edge}`});
            //     }

            //     graph.setEdge(key, edge, {
            //         arrowhead: "normal", //aesthetics behind the arrow in digraph
            //         curve: d3.curveBasis,
            //         label: " "
            //     });
            // });
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
        const svgWidth = svg.node().getBoundingClientRect().width;
        const initialScale = 0.75;
        // svg.call(zoom.transform, d3.zoomIdentity
        //     .translate((svg.attr("width") - graph.graph().width * initialScale) / 2, 20)
        //     .scale(initialScale));
        svg.call(zoom.transform, d3.zoomIdentity
            .translate((svgWidth - graph.graph().width * initialScale) / 2, 20)
            .scale(initialScale));

        svg.attr('height', graph.graph().height * initialScale + 40);
        
        
        //TODO: some click/hover features... somehow
    }

//   module.exports = {
//         render
//     }