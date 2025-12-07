import * as d3 from 'd3';
//KEVIN: dagre-d3-es in order to stay with d3@7 (version 7)
import * as dagreD3 from 'dagre-d3-es'; //

// Enhanced graph rendering with color gradients and stats panel
/*
 render takes the graph data and then renders it using d3 with color coding
*/

// SAKURA: THIS IS ALL CLAUDE SLOP REVISED FOR NOW
export function render(graphData, rootId, onNodeClick, cohortPeerIds = new Set()) {
    
    console.log("Render called. Is onNodeClick valid?", typeof onNodeClick); // Should say "function"

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
        requestAnimationFrame(() => render(graphData, rootId, onNodeClick)); 
        return; 
    }
    
    console.log(`Rendering graph with root ID: ${rootId} and ${cohortPeerIds.size} cohort peers`);
    
    // generation levels (go up down)
    const levels = calculateLevels(graphData, rootId, cohortPeerIds);
    
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
    const graph = new dagreD3.graphlib.Graph({ compound: true }).setGraph({
        rankdir: "TB",    // top to Bottom
        nodesep: 80,      // horizontal spacing
        ranksep: 80,      // vertical spacing
        marginx: 20,
        marginy: 20,
        ranker: "tight-tree"  // Use tight-tree ranker for better control
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
        } else if (level === 0) {
            // cohort peers at level 0 (same color as root)
            nodeColor = colors.root;
            console.log(`Cohort peer node ${key}: level ${level}, color ${nodeColor}`);
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
            ry: 5,
            rank: level !== undefined ? -level : undefined  // Negative because dagre ranks top-to-bottom (lower rank = higher position)
        });
    }

    // gets the edges that we have in the data
    for (const [key, value] of graphData.entries()) {
        // down children
        value.edges.forEach(adviseeId => {
            // only include the edge if the advisee is in the map
            if (graphData.has(adviseeId)) {
                // anne: don't draw edge to cohort peer (maintain level 0 position)
                if (cohortPeerIds.has(adviseeId)) {
                    console.log(`Skipping edge from ${key} to cohort peer ${adviseeId} to maintain level 0 position`);
                    return;
                }
                
                // anne: edge will be drawn manually after layout
                graph.setEdge(key, adviseeId, {
                    label: " "
                });
            }
        });

        // anne: advisor edges - skip drawing hierarchical edges for cohort peers in dagre
        // (will draw manually later to avoid affecting layout)
        value.advisors.forEach(advisorId => {
            if (graphData.has(advisorId)) {
                // anne: don't draw edge if the current node (key) is a cohort peer
                if (cohortPeerIds.has(key)) {
                    console.log(`Skipping edge from advisor ${advisorId} to cohort peer ${key} to maintain level 0 position`);
                    return; // skip this edge
                }
                
                // anne: edge will be drawn manually after layout
                graph.setEdge(advisorId, key, {
                    label: " "
                });
            }
        });
    }

    // anne: create a subgraph to group root and cohort peers at same rank
    if (cohortPeerIds.size > 0) {
        const rankGroupId = "rank0";
        graph.setNode(rankGroupId, {
            label: "",
            clusterLabelPos: 'top',
            style: 'fill: none; stroke: none;'  // Invisible container
        });
        
        // anne: add root to the rank group
        graph.setParent(rootId, rankGroupId);
        
        // anne: add all cohort peers to the same rank group
        for (const peerId of cohortPeerIds) {
            if (graph.hasNode(peerId) && peerId !== rootId) {
                graph.setParent(peerId, rankGroupId);
                console.log(`Added cohort peer ${peerId} to rank group with root`);
            }
        }
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
    svg.call(zoom).on("dblclick.zoom", null);

    

    // render obj
    const renderer = new dagreD3.render();
    // run render to draw graph
    renderer(inner, graph);
    
    // anne: draw custom curved edges
    inner.selectAll("g.edgePath path").remove();
    
    // anne: draw all edges with custom curved paths
    const lineGenerator = d3.line().curve(d3.curveBasis);
    
    for (const [key, value] of graphData.entries()) {
        const sourceNode = graph.node(key);
        if (!sourceNode) continue;
        
        // draw edges to students
        value.edges.forEach(adviseeId => {
            if (graphData.has(adviseeId) && !cohortPeerIds.has(adviseeId)) {
                const targetNode = graph.node(adviseeId);
                if (targetNode) {
                    const points = [
                        [sourceNode.x, sourceNode.y],
                        [sourceNode.x, sourceNode.y + (targetNode.y - sourceNode.y) * 0.33],
                        [targetNode.x, targetNode.y - (targetNode.y - sourceNode.y) * 0.33],
                        [targetNode.x, targetNode.y]
                    ];
                    
                    inner.append("path")
                        .attr("d", lineGenerator(points))
                        .attr("stroke", "#999")
                        .attr("stroke-width", "2")
                        .attr("fill", "none")
                        .attr("class", "custom-edge")
                        .lower();
                }
            }
        });
        
        // draw edges to advisors
        value.advisors.forEach(advisorId => {
            if (graphData.has(advisorId) && !cohortPeerIds.has(key)) {
                const advisorNode = graph.node(advisorId);
                if (advisorNode) {
                    const points = [
                        [advisorNode.x, advisorNode.y],
                        [advisorNode.x, advisorNode.y + (sourceNode.y - advisorNode.y) * 0.33],
                        [sourceNode.x, sourceNode.y - (sourceNode.y - advisorNode.y) * 0.33],
                        [sourceNode.x, sourceNode.y]
                    ];
                    
                    inner.append("path")
                        .attr("d", lineGenerator(points))
                        .attr("stroke", "#999")
                        .attr("stroke-width", "2")
                        .attr("fill", "none")
                        .attr("class", "custom-edge")
                        .lower();
                }
            }
        });
    }
    
    // anne: add horizontal lines connecting root to cohort peers and advisor lines for cohort peers
    if (cohortPeerIds.size > 0) {
        for (const peerId of cohortPeerIds) {
            if (peerId !== rootId && graph.node(peerId) && graph.node(rootId)) {
                const rootNode = graph.node(rootId);
                const peerNode = graph.node(peerId);
                
                // anne: horizontal line between root and cohort peer
                inner.append("line")
                    .attr("x1", rootNode.x)
                    .attr("y1", rootNode.y)
                    .attr("x2", peerNode.x)
                    .attr("y2", peerNode.y)
                    .attr("stroke", "#999")
                    .attr("stroke-width", "2")
                    .attr("class", "cohort-peer-line")
                    .lower(); // Send to back so it doesn't cover nodes
                
                console.log(`Drew line from root (${rootNode.x}, ${rootNode.y}) to cohort peer ${peerId} (${peerNode.x}, ${peerNode.y})`);
                
                // anne: lines from cohort peer to their advisors
                const peerData = graphData.get(peerId);
                if (peerData && peerData.advisors) {
                    peerData.advisors.forEach(advisorId => {
                        if (graph.node(advisorId)) {
                            const advisorNode = graph.node(advisorId);
                            
                            // anne: create curved path using d3.curveBasis
                            const lineGenerator = d3.line()
                                .curve(d3.curveBasis);
                            
                            // generate points for the curve (advisor -> peer)
                            const points = [
                                [advisorNode.x, advisorNode.y],
                                [advisorNode.x, advisorNode.y + (peerNode.y - advisorNode.y) * 0.33],
                                [peerNode.x, peerNode.y - (peerNode.y - advisorNode.y) * 0.33],
                                [peerNode.x, peerNode.y]
                            ];
                            
                            inner.append("path")
                                .attr("d", lineGenerator(points))
                                .attr("stroke", "#999")
                                .attr("stroke-width", "2")
                                .attr("fill", "none")
                                .attr("class", "cohort-advisor-edge")
                                .lower();
                            
                            console.log(`Drew advisor edge from ${advisorId} to cohort peer ${peerId}`);
                        }
                    });
                }
            }
        }
    }

    // click feature
    svg.selectAll("g.node")
        .style("cursor", "pointer")

         // 1. single click feature to highlight
        .on("click", function(event, nodeId) {
            if (event.detail === 2) return;

            const fullNode = graphData.get(nodeId);

            // check to see if the node has source data
            if (!fullNode || !fullNode.detail) {
                return;
            }

            showStatsPanel(fullNode.detail, graphData, nodeId);
            
            // highlight clicked node
            svg.selectAll("g.node rect")
                .style("stroke-width", "2px");
            d3.select(this).select("rect")
                .style("stroke-width", "4px")
                .style("stroke", "#ff6b6b");

        })
        
        // 2. double click feature to refocus tree
        .on("dblclick", function(event, nodeId) {
            event.stopPropagation();
            event.preventDefault();

            console.log("double clicked!", nodeId);
            const fullNode = graphData.get(nodeId);

            // check to see if the node has source data
            if (!fullNode || !fullNode.detail) {
                console.error("Clicked node missing from source data: ", nodeId);
                return;
            }

            console.log("Full node data:", fullNode.detail);

            // extract mrauth_id and check if it exists
            const mrauthId = fullNode.detail.mrauth_id;

            console.log("mrauth_id:", mrauthId, "Type:", typeof mrauthId);

            // SAKURA: new debug to show error if id is missing then refocus cannot work
            if (mrauthId) {
                console.log("Refocusing on:", fullNode.detail.givenName, "ID:", mrauthId);
                if (onNodeClick) {
                    console.log("Calling onNodeClick with:", mrauthId);
                    onNodeClick(mrauthId);
                } else {
                    console.error("onNodeClick is not defined!");
                }
            } else {
                console.error("No mrauth_id found for this node!", fullNode.detail);
                alert(`Cannot refocus on ${fullNode.detail.givenName} ${fullNode.detail.familyName} - missing ID in database`);
            }
        })

        //     if (mrauthId) {
        //         console.log("Refocusing on: ", fullNode.detail.givenName);
        //         if (onNodeClick) {
        //             onNodeClick(mrauthId);
        //         }

        //     //     //KEVIN: things don't load, so we have to tell them no data
        //     //    else {
        //     //         alert(`Cannot load tree for ${fullNode.detail.givenName} because they do not graph data.`);
        
        //     //         // shake the node or flash it red to indicate error (requires more CSS)
        //     //         d3.select(this).select("rect")
        //     //             .transition().duration(100).style("stroke", "red")
        //     //             .transition().duration(100).style("stroke", "#ff6b6b");
        //     //     }
        //     }
        // })
        
        //mouseover feature to give additional information on node
        // SAKURA: hover feature for react
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
                    `Shown Descendants: ${descendantCount}`,
                    `Total Descendants: ${nodeData.true_desc_count}`,
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
function calculateLevels(graphData, rootId, cohortPeerIds = new Set()) {
    const levels = new Map();
    
    // verify rootId 
    if (!rootId || !graphData.has(rootId)) {
        console.error(`Invalid root ID: ${rootId}`);
        return levels;
    }
    
    // SAKURA: set root to level 0
    levels.set(rootId, 0);
    
    // anne: set all cohort peers to level 0 (same horizontal line as root)
    // IMPORTANT: Mark these as LOCKED so they won't be changed by BFS
    const lockedAtZero = new Set([rootId]); // Root is always locked at 0
    
    for (const peerId of cohortPeerIds) {
        if (graphData.has(peerId)) {
            levels.set(peerId, 0);
            lockedAtZero.add(peerId); // Lock cohort peers at level 0
            console.log(`Setting cohort peer ${peerId} to level 0 (locked)`);
        }
    }
    
    console.log(`Starting level calculation from root ${rootId} with ${cohortPeerIds.size} cohort peers at level 0`);
    
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
                    // anne: Don't overwrite locked nodes (root + cohort peers)
                    if (graphData.has(childId) && !levels.has(childId) && !lockedAtZero.has(childId)) {
                        levels.set(childId, level + 1);
                        queue.push([childId, level + 1]);
                    }
                });
            } else {
                // process ancestors (negative levels)
                node.advisors.forEach(parentId => {
                    // anne: don't overwrite locked nodes (root + cohort peers)
                    if (graphData.has(parentId) && !levels.has(parentId) && !lockedAtZero.has(parentId)) {
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
    
    // SAKURA: also run BFS for cohort peers to get their descendants/ancestors
    for (const peerId of cohortPeerIds) {
        bfs(peerId, 0, 'down');
        bfs(peerId, 0, 'up');
    }
    
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


    /* 
        KEVIN: descedantCount depends on the on the graphdata rendered, 
        which may not include indirect descendants (e.g. grandchildren) from called node

        we must define a different descendantCount to get a general figure

    */
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
