import * as d3 from 'd3';
//KEVIN: dagre-d3-es in order to stay with d3@7 (version 7)
import * as dagreD3 from 'dagre-d3-es'; //

// Enhanced graph rendering with color gradients and stats panel
/*
 render takes the graph data and then renders it using d3 with color coding
*/

// SAKURA: THIS IS ALL CLAUDE SLOP REVISED FOR NOW
export function render(graphData, rootId) {
    if (graphData == null || graphData.size === 0) {
        console.error("No data");
        return;
    }
    
    // verify rootId is valid
    if (!rootId) {
        console.error("No root ID provided");
        return;
    }
    
    if (!graphData.has(rootId)) {
        console.error(`Root ID ${rootId} not found in graph data`);
        return;
    }

    //KEVIN: with react, the render method would run without a container, so we delay it
    const container = d3.select("div#container");
    const nodeCont = container.node();

    // if the container is missing OR has 0 width (meaning it's hidden)
    if (!nodeCont || nodeCont.getBoundingClientRect().width === 0) {
        console.warn("Container not ready (0px width). Retrying in next frame...");
        
        // schedule this same function to run again in ~16ms.
        requestAnimationFrame(() => render(graphData, rootId)); 
        return; 
    }
    
    console.log(`Rendering graph with root ID: ${rootId}`);
    
    // generation levels (go up down)
    const levels = calculateLevels(graphData, rootId);
    
    console.log(`Calculated levels for ${levels.size} nodes`);
    
    // SAKURA: color schemes
    // LATER ON: (sage green gradient) #1f261a #3e4d34 #5e734e #7d9a68 #9dc183
    const colors = {
        root: "#5e734e",        
        ancestor: "#1f261a",    
        gen1: "#9dc183",        
        gen2: "#9ccc65",
        gen3: "#d4e157",
        gen4: "#fff176"
    };

    // make the graph, initially empty
    const graph = new dagreD3.graphlib.Graph({}).setGraph({
        rankdir: "TB",    // top to Bottom
        nodesep: 80,      // horizontal spacing
        ranksep: 80,      // vertical spacing
        marginx: 20,
        marginy: 20
    });

    // add all nodes with color
    for (const [key, value] of graphData.entries()) {
        const level = levels.get(key);
        let nodeColor = colors.root;

        // elementary check to see if the detail data is there
        if (!value || !value.detail) {
            console.warn(`Skipping node ${key}: Missing 'detail' data.`);
            continue;
        }
        
        // FIX: decendant goes down for sus children
        if (level === undefined) {
            console.warn(`No level calculated for node ${key} (${value.detail.givenName} ${value.detail.familyName})`);
            nodeColor = colors.gen5; 
        } else if (key === rootId) {
            nodeColor = colors.root;
            console.log(`Root node ${key}: level ${level}, color ${nodeColor}`);
        } else if (level < 0) {
            // ancestors (advisors)
            nodeColor = colors.ancestor;
            console.log(`Ancestor node ${key}: level ${level}, color ${nodeColor}`);
        } else {
            // descendants (colors gets lighter)
            const genColors = [colors.gen1, colors.gen2, colors.gen3, colors.gen4, colors.gen5];
            nodeColor = genColors[Math.min(level - 1, genColors.length - 1)] || colors.gen5;
            console.log(`Descendant node ${key}: level ${level}, color ${nodeColor}`);
        }
        
        graph.setNode(key, {
            label: `${value.detail.givenName} ${value.detail.familyName}\n(${value.detail.yearAwarded})`,
            detail: value.detail,
            style: `fill: ${nodeColor}; stroke: #333; stroke-width: 2px;`,
            labelStyle: "font-size: 13px; font-weight: 500; fill: #fff;",
            rx: 5,
            ry: 5
        });
    }

    // gets the edges that we have in the data
    for (const [key, value] of graphData.entries()) {
        // down children
        value.edges.forEach(adviseeId => {
            // only include the edge if the advisee is in the map
            if (graphData.has(adviseeId)) {
                graph.setEdge(key, adviseeId, {
                    arrowhead: "normal",
                    curve: d3.curveBasis,
                    style: "stroke: #666; stroke-width: 2px;",
                    arrowheadStyle: "fill: #666;",
                    label: " "
                });
            }
        });

        value.advisors.forEach(advisorId => {
            if (graphData.has(advisorId)) {
                graph.setEdge(advisorId, key, {
                    arrowhead: "normal",
                    curve: d3.curveBasis,
                    style: "stroke: #999; stroke-width: 2px;",
                    arrowheadStyle: "fill: #999;",
                    label: " "
                });
            }
        });
    }

    // set up scene
    const svg = d3.select("div#container").select("svg"),
        inner = svg.select("g");

    // clear previous 
    inner.selectAll("*").remove();

    // zoom feature
    const zoom = d3.zoom().on("zoom", function(event) {
        inner.attr("transform", event.transform);
    });
    svg.call(zoom);

    

    // render obj
    const renderer = new dagreD3.render();
    // run render to draw graph
    renderer(inner, graph);
    // small timeout to delay render
    // setTimeout(() => {
    //     renderer(inner, graph);
    // }, 100);

    

    // add click handlers for nodes
    svg.selectAll("g.node")
        .style("cursor", "pointer")
        .on("click", function(event, nodeId) {
            const node = graph.node(nodeId);
            showStatsPanel(node.detail, graphData, nodeId);
            
            // highlight clicked node
            svg.selectAll("g.node rect")
                .style("stroke-width", "2px");
            d3.select(this).select("rect")
                .style("stroke-width", "4px")
                .style("stroke", "#ff6b6b");


        })
        //mouseover feature to highlight the particular node
        // .on("mouseover", function() { 
        //     d3.select(this).select("rect")
        //         .style("opacity", "0.8");
        // })
        //mousever feature to give additional information on node

        // SAKURA: hover feature for react or yea
        .on("mouseover", function(event, nodeId) {
            const targetElement = d3.select(event.currentTarget);
            targetElement.raise();
            
            // ensure it's a valid DOM element 
            if (!this) return;
            
            // retrieve the node data object
            const lookupId = nodeId; 
            const nodeValue = graph.node(lookupId);
            
            if (!nodeValue || !nodeValue.detail) {
                console.error("Missing custom data for node ID:", lookupId);
                return;
            }
            
            const nodeData = nodeValue.detail;
            
            // grab full node data from graphData for advisors and descendants
            const fullNode = graphData.get(lookupId);
            
            // advisor names
            const advisorNames = fullNode.advisors
                .map(id => {
                    const advisor = graphData.get(id);
                    return advisor ? `${advisor.detail.givenName} ${advisor.detail.familyName}` : "Unknown";
                })
                .join(", ") || "N/A";
            
            // count descendants
            const descendantCount = fullNode.edges.filter(id => graphData.has(id)).length;
            
            // remove old tooltips before a new one
            targetElement.selectAll(".hover-tooltip-group").remove();
            
            const tooltipGroup = targetElement.append("g")
                .attr("class", "hover-tooltip-group")
                .attr("transform", "translate(50, -50)");
            
            const tooltipText = tooltipGroup.append("text")
                .attr("x", 30)
                .attr("y", -20)
                .attr("text-anchor", "start")
                .style("font-size", "13px")
                .style("fill", "#333")
                .style("font-weight", "500");
            
            // bind the tooltip data
            tooltipText.selectAll("tspan")
                .data([
                    `${nodeData.givenName} ${nodeData.familyName}`,
                    `─────────────────────────────`,
                    `Advisors: ${advisorNames}`,
                    `Direct Descendants: ${descendantCount}`,
                    `School: ${nodeData.school || 'N/A'}`,
                    `Thesis: ${nodeData.thesis || 'N/A'}`
                ])
                .enter()
                .append("tspan")
                .attr("x", 25)
                .attr("dy", (d, i) => i === 0 ? "0em" : "1.4em")
                .style("font-weight", (d, i) => i === 0 ? "700" : "400")
                .style("font-size", (d, i) => i === 0 ? "15px" : "13px")
                .style("fill", (d, i) => i === 1 ? "#999" : "#333")
                .text(d => d);
            
            // rectangle box that needs to come in AFTER the text above
            // requires a timeout
            setTimeout(() => {
                try {
                    const box = tooltipText.node().getBBox();
                    
                    // append the rectangle to group before text
                    tooltipGroup.insert("rect", "text")
                        .attr("x", box.x - 8)
                        .attr("y", box.y - 8)
                        .attr("width", box.width + 16)
                        .attr("height", box.height + 16)
                        .style("fill", "#ffffff")
                        .style("stroke", "#5e734e")
                        .style("stroke-width", 2)
                        .attr("rx", 6)
                        .attr("ry", 6)
                        .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.1))");
                } catch (e) {
                    console.warn("Could not calculate tooltip bounding box: ", e);
                }
            }, 0); //small timeout, could increase
        })
        .on("mouseout", function() {
            const targetElement = d3.select(this);
            d3.select(this).select("rect")
                .style("opacity", "1");
            
            // remove the tooltip group from above
            targetElement.selectAll(".hover-tooltip-group").remove();
        });

    // SAKURA: center the visual
    const svgNode = svg.node();
    const svgBounds = svgNode.getBoundingClientRect();
    const graphWidth = graph.graph().width;
    const graphHeight = graph.graph().height;

    // calculate scale to fit the entire graph with padding
    const scaleX = (svgBounds.width - 100) / graphWidth; 
    const scaleY = (svgBounds.height - 100) / graphHeight; 
    const initialScale = Math.min(scaleX, scaleY, 0.75); 

    // center 
    const translateX = (svgBounds.width - graphWidth * initialScale) / 2;
    const translateY = (svgBounds.height - graphHeight * initialScale) / 2;

    // transform
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(initialScale));

    // SVG height to fit graph
    svg.attr('height', Math.max(graphHeight * initialScale + 100, 600));

    //KEVIN: defensive measure to stop crashes with container
    if (graphWidth === 0 || graphHeight === 0 || svgBounds.width === 0) {
        console.warn("Graph or Container has 0 dimensions. Skipping zoom/center.");
        // Default to scale 1 so it doesn't break
        svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
        return; 
    }

    // stats panel for root node by default (delete or use later it's js hidden rn in css)
    const rootNode = graph.node(rootId);
    if (rootNode) {
        showStatsPanel(rootNode.detail, graphData, rootId);
    }
}

// SAKURA: calculate generation levels from root
function calculateLevels(graphData, rootId) {
    const levels = new Map();
    
    // verify rootId 
    if (!rootId || !graphData.has(rootId)) {
        console.error(`Invalid root ID: ${rootId}`);
        return levels;
    }
    
    levels.set(rootId, 0);
    console.log(`Starting level calculation from root ${rootId}`);
    
    const visited = new Set();
    
    // SAKURA: BFS to calculate levels
    function bfs(startId, startLevel, direction) {
        const queue = [[startId, startLevel]];
        let processedCount = 0;
        
        while (queue.length > 0) {
            const [currentId, level] = queue.shift();
            
            // visited tracking
            const visitedKey = `${currentId}-${direction}`;
            if (visited.has(visitedKey)) continue;
            visited.add(visitedKey);
            
            processedCount++;
            
            const node = graphData.get(currentId);
            if (!node) {
                console.warn(`Node ${currentId} not found in graph data during BFS`);
                continue;
            }
            
            if (direction === 'down') {
                // process descendants
                node.edges.forEach(childId => {
                    if (graphData.has(childId) && !levels.has(childId)) {
                        levels.set(childId, level + 1);
                        queue.push([childId, level + 1]);
                    }
                });
            } else {
                // process ancestors (negative levels)
                node.advisors.forEach(parentId => {
                    if (graphData.has(parentId) && !levels.has(parentId)) {
                        levels.set(parentId, level - 1);
                        queue.push([parentId, level - 1]);
                    }
                });
            }
        }
        
        console.log(`BFS ${direction}: processed ${processedCount} nodes`);
    }
    
    bfs(rootId, 0, 'down');
    bfs(rootId, 0, 'up');
    
    console.log(`Level calculation complete. Levels assigned to ${levels.size} nodes`);
    
    // SAKURA: log any nodes that don't have levels assigned
    for (const [key, value] of graphData.entries()) {
        if (!levels.has(key)) {
            console.warn(`Node ${key} (${value.detail.givenName} ${value.detail.familyName}) has no level assigned!`);
        }
    }
    return levels;
}

// SAKURA: stats panel for selected node (not used rn for later?)
function showStatsPanel(detail, graphData, nodeId) {
    const panel = document.getElementById("stats-panel");
    if (!panel) return;
    
    // node data
    const node = graphData.get(nodeId);
    
    // advisor names
    const advisorNames = node.advisors
        .map(id => {
            const advisor = graphData.get(id);
            return advisor ? `${advisor.detail.givenName} ${advisor.detail.familyName}` : "Unknown";
        })
        .join(", ") || "N/A";
    
    // descendant count
    const descendantCount = node.edges.filter(id => graphData.has(id)).length;
    
    // panel content
    panel.innerHTML = `
        <h3>${detail.givenName} ${detail.familyName}</h3>
        <div class="stat-row">
            <span class="stat-label">PhD Year:</span>
            <span class="stat-value">${detail.yearAwarded}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">MR Author ID:</span>
            <span class="stat-value">${detail.mrauth_id}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Advisors:</span>
            <span class="stat-value">${advisorNames}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Direct Descendants:</span>
            <span class="stat-value">${descendantCount}</span>
        </div>
    `;
    
    panel.style.display = "block";
}
