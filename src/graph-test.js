//simple example from Gemini, good for study

// Wait for the HTML document to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {

    // 1. PROVIDE SAMPLE DATA
    // We create sample data because 'this.graphData' doesn't exist.
    // We'll use a Map, just like in your example.
    const graphData = new Map();
    graphData.set("Start Node", { edges: ["Node A", "Node B"], detail: "This is the beginning" });
    graphData.set("Node A", { edges: ["End Node"], detail: "Detail for A" });
    graphData.set("Node B", { edges: ["Node A", "End Node"], detail: "Detail for B" });
    graphData.set("End Node", { edges: [], detail: "This is the end" });


    // 2. CREATE THE GRAPH
    // 'dagreD3' is a global variable from the script tag in the HTML
    const g = new dagreD3.graphlib.Graph({}).setGraph({});

    // 3. ADD NODES AND EDGES
    for (const [key, value] of graphData.entries()) {
        // Set up the node
        g.setNode(key, {
            label: key,
            detail: value.detail // We can store this, but dagre won't use it by default
        });
        
        // Corrected typo: 'value.edges', not 'values.edges'
        value.edges.forEach(edgeKey => {
            // Check if the target node exists. If not, add it.
            if (!graphData.has(edgeKey)) {
                 g.setNode(edgeKey, { label: edgeKey });
            }
            
            // Set up the edge
            g.setEdge(key, edgeKey, {
                arrowhead: "normal",
                curve: d3.curveBasis, // 'd3' is a global variable
                label: " "
            });
        });
    }

    // 4. SELECT THE SVG ELEMENT
    // Corrected typo: 'svg', not 'csv'
    // 'd3' is the global variable from the script tag
    const svg = d3.select("div#container").select("svg");
    
    // Corrected selector: 'g', not 'graph'
    const inner = svg.select("g");

    // 5. SET UP THE RENDERER
    const render = new dagreD3.render();

    // 6. RENDER THE GRAPH
    render(inner, g);

    // 7. ADD ZOOM (Your TODO!)
    // This makes the graph pannable and zoomable
    const zoom = d3.zoom().on("zoom", (event) => {
        inner.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Optional: Center the graph on load
    const graphWidth = g.graph().width + 40;
    const graphHeight = g.graph().height + 40;
    const svgWidth = parseInt(svg.style("width"));
    const svgHeight = parseInt(svg.style("height"));
    const initialScale = Math.min(svgWidth / graphWidth, svgHeight / graphHeight);
    
    svg.call(zoom.transform, d3.zoomIdentity
        .translate((svgWidth - g.graph().width * initialScale) / 2, 20)
        .scale(initialScale));

});