// Enhanced graph rendering with color gradients and stats panel

/*
 render takes the graph data and then renders it using d3 with color coding
*/

//  // SAKURA'S FIX: THIS IS ALL CLAUDE SLOP FOR NOW


export function render(graphData, rootId) {
    if (graphData == null || graphData.size == 0) {
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
    
    console.log(`Rendering graph with root ID: ${rootId}`);
    
    // Calculate generation levels (depth from root)
    const levels = calculateLevels(graphData, rootId);
    
    console.log(`Calculated levels for ${levels.size} nodes`);
    
    // Define color schemes
    // LATER ON: (sage green gradient) #1f261a #3e4d34 #5e734e #7d9a68 #9dc183
    const colors = {
        root: "#5e734e",        
        ancestor: "#1f261a",    
        gen1: "#9dc183",        
        gen2: "#9ccc65",
        gen3: "#d4e157",
        gen4: "#fff176"
    };

    // We actually make the graph, initially empty
    const graph = new dagreD3.graphlib.Graph({}).setGraph({
        rankdir: "TB",    // Top to Bottom
        nodesep: 80,      // Horizontal spacing
        ranksep: 80,      // Vertical spacing
        marginx: 20,
        marginy: 20
    });

    // Add all nodes with color coding
    for (const [key, value] of graphData.entries()) {
        const level = levels.get(key);
        let nodeColor = colors.root;
        
        // FIX: Better handling of undefined levels with debug logging
        if (level === undefined) {
            console.warn(`No level calculated for node ${key} (${value.detail.givenName} ${value.detail.familyName})`);
            nodeColor = colors.gen5; // Default color
        } else if (key === rootId) {
            nodeColor = colors.root;
            console.log(`Root node ${key}: level ${level}, color ${nodeColor}`);
        } else if (level < 0) {
            // Ancestors (advisors)
            nodeColor = colors.ancestor;
            console.log(`Ancestor node ${key}: level ${level}, color ${nodeColor}`);
        } else {
            // Descendants - gradient gets lighter
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

    // Gets the edges that we have in the data
    for (const [key, value] of graphData.entries()) {
        // Logic to draw the downstream/children
        value.edges.forEach(adviseeId => {
            // We only include the edge if the advisee is in the map
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

    // Now setting up the scene using d3 for the visual
    const svg = d3.select("div#container").select("svg"),
        inner = svg.select("g");

    // Clear previous content
    inner.selectAll("*").remove();

    // Zoom feature
    const zoom = d3.zoom().on("zoom", function(event) {
        inner.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Make render obj
    const renderer = new dagreD3.render();
    // Run render and use the graph data to draw graph
    renderer(inner, graph);

    // Add click handlers for nodes
    svg.selectAll("g.node")
        .style("cursor", "pointer")
        .on("click", function(event, nodeId) {
            const node = graph.node(nodeId);
            showStatsPanel(node.detail, graphData, nodeId);
            
            // Highlight clicked node
            svg.selectAll("g.node rect")
                .style("stroke-width", "2px");
            d3.select(this).select("rect")
                .style("stroke-width", "4px")
                .style("stroke", "#ff6b6b");
        })
        .on("mouseover", function() {
            d3.select(this).select("rect")
                .style("opacity", "0.8");
        })
        .on("mouseout", function() {
            d3.select(this).select("rect")
                .style("opacity", "1");
        });

    // Centering the visual
    const svgWidth = svg.node().getBoundingClientRect().width;
    const initialScale = 0.75;
    svg.call(zoom.transform, d3.zoomIdentity
        .translate((svgWidth - graph.graph().width * initialScale) / 2, 20)
        .scale(initialScale));

    svg.attr('height', graph.graph().height * initialScale + 40);
    
    // Show stats panel for root node by default
    const rootNode = graph.node(rootId);
    if (rootNode) {
        showStatsPanel(rootNode.detail, graphData, rootId);
    }
}

// Calculate generation levels from root
function calculateLevels(graphData, rootId) {
    const levels = new Map();
    
    // FIX: Verify rootId before setting level
    if (!rootId || !graphData.has(rootId)) {
        console.error(`Invalid root ID: ${rootId}`);
        return levels;
    }
    
    levels.set(rootId, 0);
    console.log(`Starting level calculation from root ${rootId}`);
    
    const visited = new Set();
    
    // BFS to calculate levels
    function bfs(startId, startLevel, direction) {
        const queue = [[startId, startLevel]];
        let processedCount = 0;
        
        while (queue.length > 0) {
            const [currentId, level] = queue.shift();
            
            // FIX: Better visited tracking
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
                // Process descendants
                node.edges.forEach(childId => {
                    if (graphData.has(childId) && !levels.has(childId)) {
                        levels.set(childId, level + 1);
                        queue.push([childId, level + 1]);
                    }
                });
            } else {
                // Process ancestors (negative levels)
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
    
    // FIX: Log any nodes that don't have levels assigned
    for (const [key, value] of graphData.entries()) {
        if (!levels.has(key)) {
            console.warn(`Node ${key} (${value.detail.givenName} ${value.detail.familyName}) has no level assigned!`);
        }
    }
    
    return levels;
}

// Show stats panel for selected node
function showStatsPanel(detail, graphData, nodeId) {
    const panel = document.getElementById("stats-panel");
    if (!panel) return;
    
    // Get node data
    const node = graphData.get(nodeId);
    
    // Build advisor names
    const advisorNames = node.advisors
        .map(id => {
            const advisor = graphData.get(id);
            return advisor ? `${advisor.detail.givenName} ${advisor.detail.familyName}` : "Unknown";
        })
        .join(", ") || "N/A";
    
    // Build descendant count
    const descendantCount = node.edges.filter(id => graphData.has(id)).length;
    
    // Update panel content
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