import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadData, findIdByName, created, getSuggestions} from '../graph-data.js';
import { render } from '../graph.js';
import FilterPanel from './FilterPanel';
import './Graph.css';

function Graph() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentMrauthId, setCurrentMrauthId] = useState("462675");
  const [focusedName, setFocusedName] = useState('');
  const [filters, setFilters] = useState({
    university: '',
    yearMin: 1800,
    yearMax: 2024,
    showAdvisors: true,
    showCohortPeers: true,
    showStudents: true
  });
  const hasLoadedData = useRef(false);
  const handleNodeClickRef = useRef(null);

  // KEVIN: handleNodeClick function to trigger redraw of graph
  // SAKURA: buildRenderGraph function from main.js (wrapped in useCallback)
  const buildRenderGraph = useCallback((mrauth_id, activeFilters = filters) => {
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
    
    const { graphData: myGraphData, rootInternalId, cohortPeerIds } = result;
    
    if (!myGraphData || myGraphData.size === 0) {
      console.error(`No graph data created for ID: ${mrauth_id}`);
      // alert("The selected academic does not match the current filters.");
      return;
    }
    
    if (!rootInternalId) {
      console.error(`No root internal ID found for ID: ${mrauth_id}`);
      return;
    }
    
    console.log(`Data loaded for ${myGraphData.size} nodes. Root ID: ${rootInternalId}. Rendering...`);
    
    // anne: grab and set the focused mathematician's name
    const rootNode = myGraphData.get(rootInternalId);
    if (rootNode && rootNode.detail) {
      const fullName = `${rootNode.detail.givenName} ${rootNode.detail.familyName}`.trim();
      setFocusedName(fullName);
    }
    
    // SAKURA: correct rootInternalId directly from the created() function
    // KEVIN: added handleNodeClick for the input
    render(myGraphData, rootInternalId, handleNodeClickRef.current, cohortPeerIds || new Set());
  }, [filters]);

    // move nodeclick after bruhhhh
  const handleNodeClick = useCallback((newMrauthId) => {
    if (!newMrauthId) return;
    console.log(`Refocusing graph on ID: ${newMrauthId}`);

    //reset the searchQuery as empty ''
    setSearchQuery('');

    //also reset the node of focus to what newMrauthId
    setCurrentMrauthId(newMrauthId);

    buildRenderGraph(newMrauthId);
  }, [buildRenderGraph]); 

   handleNodeClickRef.current = handleNodeClick;

  //KEVIN: handleSearch constant to deal with the query
  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    // exact match check first
    let targetId = findIdByName(searchQuery);
    
    if (!targetId) {
      // try fuzzy search if no exact match found
      const fuzzyResults = getSuggestions(searchQuery);
      if (fuzzyResults && fuzzyResults.length > 0) {
        // take the best match
        targetId = fuzzyResults[0].id;
        setSearchQuery(fuzzyResults[0].name); // autocorrect the input
      }
    }

    if (targetId) {
      setCurrentMrauthId(targetId);
      buildRenderGraph(targetId, filters);
    } else {
      alert("Academic not found! Try checking the spelling.");
    }
  };

  // SAKURA: filter change handler
  function handleFilterChange(newFilters) {
    console.log("[Graph] Filters updated:", newFilters);
    console.log("[Graph] Current mrauth_id:", currentMrauthId);
    setFilters(newFilters);
  }

  //KEVIN: autocomplete logic

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length > 1) {
      try {
        const results = getSuggestions(value);
        console.log("[autocomplete] query:", value, " -> results:", results);
        setSuggestions(results);
        // setSuggestions(true); 
        setShowSuggestions(results.length > 0);
      } catch (err){
        console.error("[autocomplete] getSuggestions error:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    // anne: wait for search button click (or pressing enter) to build tree
  }

  // hide suggestions when clicking outside/blurring
  const handleBlur = () => {
    // Delay hiding to allow click event on suggestion to fire first
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // SAKURA: main() function from main.js (converted to useEffect)
  useEffect(() => {
    async function initializeData() {
      if (hasLoadedData.current) return;
      
      console.log("Loading academic data...");
      await loadData();
      console.log("Data loaded.");
      
      buildRenderGraph("462675", filters);
      
      setIsLoading(false);
      hasLoadedData.current = true;
    }
    
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // SAKURA: re-render when filters change
  useEffect(() => {
    if (!isLoading && currentMrauthId) {
      buildRenderGraph(currentMrauthId, filters);
    }
  }, [filters, buildRenderGraph, currentMrauthId, isLoading]);

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
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((s, index) => (
                    <div 
                      key={`${s.id}-${index}`} 
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(s)}
                    >
                      <span className="suggestion-name">{s.name}</span>
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

      <div className="content-container" style={{ display: isLoading ? 'none' : 'flex' }}>
        <div id="container" className="graph-container">
          {focusedName && (
            <div className="focused-name-display">
              {focusedName}
            </div>
          )}
          <svg><g/></svg>
        </div>
        
        <FilterPanel onFilterChange={handleFilterChange} />
      </div>
      
      <div id="stats-panel"></div>
    </div>
  );
}
export default Graph;