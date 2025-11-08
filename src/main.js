//everything is directed graphs (I would hope we are using arrows)


import { render } from './graph.js';
import { created } from './graph-data.js';

// 1. Call created() to get your data
const myGraphData = created();

// 2. Check if it worked
if (myGraphData && myGraphData.size > 0) {
    // 3. Pass the data to render()
    render(myGraphData);
} else {
    console.error("Failed to load or create graph data. Graph will not be rendered.");
}






// TEST


// // Create a new directed graph
// var g = new dagreD3.graphlib.Graph().setGraph({});

// g.setNode("house", { shape: "house", label: "house" });
// g.setNode("rect", { shape: "rect" });
// g.setEdge("house", "rect", { arrowhead: "hollowPoint" });

// var svg = d3.select("svg"),
//     inner = svg.select("g");

// // Set up zoom support
// var zoom = d3.zoom().on("zoom", function() {
//     inner.attr("transform", d3.event.transform);
//   });
// svg.call(zoom);

// // Create the renderer
// var render = new dagreD3.render();

// // Add our custom shape (a house)
// render.shapes().house = function(parent, bbox, node) {
//   var w = bbox.width,
//       h = bbox.height,
//       points = [
//         { x:   0, y:        0 },
//         { x:   w, y:        0 },
//         { x:   w, y:       -h },
//         { x: w/2, y: -h * 3/2 },
//         { x:   0, y:       -h }
//       ];
//       shapeSvg = parent.insert("polygon", ":first-child")
//         .attr("points", points.map(function(d) { return d.x + "," + d.y; }).join(" "))
//         .attr("transform", "translate(" + (-w/2) + "," + (h * 3/4) + ")");

//   node.intersect = function(point) {
//     return dagreD3.intersect.polygon(node, points, point);
//   };

//   return shapeSvg;
// };

// // Add our custom arrow (a hollow-point)
// render.arrows().hollowPoint = function normal(parent, id, edge, type) {
//   var marker = parent.append("marker")
//     .attr("id", id)
//     .attr("viewBox", "0 0 10 10")
//     .attr("refX", 9)
//     .attr("refY", 5)
//     .attr("markerUnits", "strokeWidth")
//     .attr("markerWidth", 8)
//     .attr("markerHeight", 6)
//     .attr("orient", "auto");

//   var path = marker.append("path")
//     .attr("d", "M 0 0 L 10 5 L 0 10 z")
//     .style("stroke-width", 1)
//     .style("stroke-dasharray", "1,0")
//     .style("fill", "#fff")
//     .style("stroke", "#333");
//   dagreD3.util.applyStyle(path, edge[type + "Style"]);
// };

// // Run the renderer. This is what draws the final graph.
// render(inner, g);

// // Center the graph
// var initialScale = 0.75;
// svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

// svg.attr('height', g.graph().height * initialScale + 40);


// //TODO: parse data (JSON) into graph (in general, somehow get a graph working)

// function dataToGraph(d) {
//     //what is decompression?
//     let nodes = d.nodes;
//     let edges = d.edges;
// }
//     // will need to deal with IDs and also with how each graph finds itself (adjacent nodes/edges)



// //TODO: search bar feature functions

// // setting up the search bar

// function searchBar(text, textInputID, resultsID) {
//     d3.select(textInputID).property('value', text);
//     d3.select(resultsID).style('display', 'none');
// }

// function suggestNames(textInputID, resultsID) {
//     let searchString = d3.select(textInputID).property('value');
//     let autocomplete = d3.select(resultsID);
//     console.log('Autocomplete: ' + searchString);
// }