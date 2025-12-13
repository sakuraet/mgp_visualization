import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadData, findIdByName, created, getSuggestions } from '../graph-data.js';
import { render } from '../graph.js';
import FilterPanel from './FilterPanel';
import MapNetworkView from './MapNetworkView';
import UNIVERSITY_COORDS from "../university_coordinates";
import './Graph.css'; 

function Graph({ viewMode, onViewModeChange }) {

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [currentMrauthId, setCurrentMrauthId] = useState("462675");
  const [focusedName, setFocusedName] = useState('');

  const [graphData, setGraphData] = useState(null);
  const [focusNode, setFocusNode] = useState(null);

  // sakura: applied filters, only updated after Apply Filters
  const [appliedFilters, setAppliedFilters] = useState({
    university: '',
    yearMin: 1800,
    yearMax: 2024,
    showAdvisors: true,
    showCohortPeers: true,
    showStudents: true
  });

  const hasInitialized = useRef(false);
  const suppressNextAlert = useRef(false);
  const alertAllowed = useRef(false);
  const hasLoadedData = useRef(false);
  const handleNodeClickRef = useRef(null);

  // KEVIN & SAKURA: MAIN GRAPH DRAW FUNCTION
  const buildRenderGraph = useCallback(
    (mrauth_id, activeFilters = appliedFilters) => {
      if (!mrauth_id) {
        console.error("No ID provided to render.");
        return;
      }

      console.log(`[Graph.jsx] Requesting build for: ${mrauth_id}`);

      const result = created(mrauth_id, activeFilters);
      if (!result) {
        console.error(`Failed to create graph data for ID: ${mrauth_id}`);
        return;
      }

      // ALERT if root is filtered out
      if (
        result.rootFilteredOut === true &&
        hasInitialized.current &&
        alertAllowed.current &&
        !suppressNextAlert.current
      ) {
        alert(
          `${focusedName || "The selected mathematician"} does not meet the current filter criteria, but is still included to allow the academic tree to be displayed.`
        );
      }

      suppressNextAlert.current = false;
      alertAllowed.current = false;

      const { graphData: myGraphData, rootInternalId, cohortPeerIds } = result;

      if (!myGraphData || myGraphData.size === 0) {
        console.error("No graph data returned.");
        return;
      }

      if (!rootInternalId) {
        console.error("No root ID found.");
        return;
      }

      // grab name
      const rootNode = myGraphData.get(rootInternalId);
      if (rootNode && rootNode.detail) {
        const fullName = `${rootNode.detail.givenName} ${rootNode.detail.familyName}`.trim();
        setFocusedName(fullName);
      }

      // map data for map view
      const mapData = convertGraphDataForMap(myGraphData, rootInternalId, cohortPeerIds || new Set());
      setGraphData(mapData);
      setFocusNode(rootInternalId);

      // render D3 graph
      render(myGraphData, rootInternalId, handleNodeClickRef.current, cohortPeerIds || new Set());
    },
    [appliedFilters, focusedName]
  );

  // sakura: convert graph map into node/link arrays for MapNetworkView
  const convertGraphDataForMap = (graphDataMap, rootId, cohortPeerIds) => {
    const nodes = [];
    const links = [];

    const ancestorIds = new Set();
    graphDataMap.forEach((nodeData) => {
      if (nodeData.advisors) {
        nodeData.advisors.forEach((advisorId) => ancestorIds.add(advisorId));
      }
    });

    graphDataMap.forEach((nodeData, nodeId) => {
      if (!nodeData.detail) return;

      const detail = nodeData.detail;

      // Correct university extraction
      let university = "Unknown";

      // Case 1: detail.school exists (might be a string OR array)
      if (detail.school) {
        university = Array.isArray(detail.school)
          ? detail.school[0]
          : detail.school;
      }

      // Case 2: fallback to detail.schools[]
      else if (detail.schools && detail.schools.length > 0) {
        university = detail.schools[0];
      }

      // Get coordinates
      const coords = UNIVERSITY_COORDS[university];

      if (!coords) {
        console.warn("Missing coords for:", university);
        return; // skip this node
      }

      const advisorNames = [];
      if (nodeData.advisors) {
        nodeData.advisors.forEach((advId) => {
          const advNode = graphDataMap.get(advId);
          if (advNode?.detail) {
            advisorNames.push(`${advNode.detail.givenName || ''} ${advNode.detail.familyName || ''}`.trim());
          }
        });
      }

      nodes.push({
        id: nodeId,
        name: `${detail.givenName || ''} ${detail.familyName || ''}`.trim(),
        university,
        year: detail.yearAwarded || null,
        thesis: detail.thesis || null,
        lat: coords ? coords[0] : null,
        lng: coords ? coords[1] : null,
        advisors: advisorNames,
        totalDescendants: detail.true_desc_count || '0',
        shownDescendants: nodeData.edges?.length || 0,
        mrauth_id: detail.mrauth_id,
        isAncestor: ancestorIds.has(nodeId),
        isFocus: nodeId === rootId,
        isCohortPeer: cohortPeerIds.has(nodeId)
      });
    });

    // edges
    graphDataMap.forEach((nodeData, nodeId) => {
      if (nodeData.advisors) {
        nodeData.advisors.forEach((advId) => {
          links.push({ source: advId, target: nodeId });
        });
      }
      if (nodeData.students) {
        nodeData.students.forEach((stuId) => {
          links.push({ source: nodeId, target: stuId });
        });
      }
    });

    return { nodes, links };
  };

  // node click handler (refocus graph)
  const handleNodeClick = useCallback(
    (newMrauthId) => {
      if (!newMrauthId) return;
      setSearchQuery('');
      setCurrentMrauthId(newMrauthId);
      buildRenderGraph(newMrauthId, appliedFilters);
    },
    [buildRenderGraph, appliedFilters]
  );

  handleNodeClickRef.current = handleNodeClick;

  // Kevin: search bar submit
  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);

    let targetId = findIdByName(searchQuery);
    if (!targetId) {
      const fuzzy = getSuggestions(searchQuery);
      if (fuzzy?.length > 0) {
        targetId = fuzzy[0].id;
        setSearchQuery(fuzzy[0].name);
      }
    }

    if (targetId) {
      onViewModeChange("graph");
      setCurrentMrauthId(targetId);
      buildRenderGraph(targetId, appliedFilters);
    } else {
      alert("Academic not found!");
    }
  };

  // Kevin: AUTOCOMPLETE LOGIC
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length > 1) {
      try {
        const results = getSuggestions(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (s) => {
    setSearchQuery(s.name);
    setShowSuggestions(false);
  };

  const handleBlur = () =>
    setTimeout(() => setShowSuggestions(false), 200);

  // INITIAL LOAD
  useEffect(() => {
    async function init() {
      if (hasLoadedData.current) return;

      await loadData();

      buildRenderGraph("462675", appliedFilters);

      setIsLoading(false);
      hasLoadedData.current = true;

      setTimeout(() => (hasInitialized.current = true), 300);
    }
    init();
  }, []); // eslint-disable-line

  // APPLY FILTERS EFFECT (redraw graph only after Apply Filters)
  const handleAppliedFilters = (newFilters) => {
    console.log("[Graph] APPLY FILTERS received:", newFilters);
    alertAllowed.current = true;
    suppressNextAlert.current = false;

    setAppliedFilters(newFilters);
  };

  // re-render graph after filters applied
  useEffect(() => {
    if (!isLoading && currentMrauthId) {
      buildRenderGraph(currentMrauthId, appliedFilters);
    }
  }, [appliedFilters, isLoading, currentMrauthId, buildRenderGraph]);

  // force redraw when switching back to graph view
  useEffect(() => {
    if (!isLoading && viewMode === 'graph' && currentMrauthId) {
      setTimeout(() => {
        buildRenderGraph(currentMrauthId, appliedFilters);
      }, 100); // small delay ensures DOM is ready
    }
  }, [viewMode, isLoading, currentMrauthId, buildRenderGraph, appliedFilters]);

  // Render
  return (
    <div className="graph-wrapper">
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <label>
            Enter a name:
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                placeholder="Dio Lewis Holl"
                autoComplete="off"
                disabled={isLoading}
              />

              {showSuggestions && (
                <div className="suggestions-dropdown">
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(s)}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>

          <button type="submit" disabled={isLoading}>
            Search
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {/* CONDITIONAL RENDER — VIEW MODE ONLY APPLIES AFTER APPLY FILTERS */}
      <div className="content-container" style={{ display: isLoading ? 'none' : 'flex' }}>
        {viewMode === 'map' ? (
          <div className="map-view-container" style={{ flex: 1, height: '600px' }}>
            {focusedName && <div className="focused-name-display">{focusedName}</div>}

            <MapNetworkView
              graphData={graphData}
              focusNode={focusNode}
              onNodeClick={handleNodeClick}
            />
          </div>
        ) : (
          <div id="container" className="graph-container">
            {focusedName && <div className="focused-name-display">{focusedName}</div>}
            <svg><g/></svg>
          </div>
        )}

        {/*graph receives temporary view mode only after Apply Filters */}
        <FilterPanel 
          onFilterChange={handleAppliedFilters}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>

      <div id="stats-panel"></div>
    </div>
  );
}

export default Graph;