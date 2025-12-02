import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadData, findIdByName, created } from '../graph-data.js';
import { render } from '../graph.js';
import FilterPanel from './FilterPanel';
import './Graph.css';

function Graph() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMrauthId, setCurrentMrauthId] = useState("462675");
  const [filters, setFilters] = useState({
    university: '',
    yearMin: 1800,
    yearMax: 2024,
    showAdvisors: true,
    showCohortPeers: true,
    showStudents: true
  });
  const hasLoadedData = useRef(false);

  // SAKURA: buildRenderGraph function from main.js (wrapped in useCallback)
  const buildRenderGraph = useCallback((mrauth_id, activeFilters = filters) => {
    if (!mrauth_id) {
      console.error("No ID provided to render.");
      return;
    }
    
    console.log(`Building graph for mrauth_id: ${mrauth_id}`);
    
    const result = created(mrauth_id, activeFilters);
    
    if (!result) {
      console.error(`Failed to create graph data for ID: ${mrauth_id}`);
      return;
    }
    
    const { graphData: myGraphData, rootInternalId, cohortPeerIds } = result;
    
    if (!myGraphData || myGraphData.size === 0) {
      console.error(`No graph data created for ID: ${mrauth_id}`);
      return;
    }
    
    if (!rootInternalId) {
      console.error(`No root internal ID found for ID: ${mrauth_id}`);
      return;
    }
    
    console.log(`Data loaded for ${myGraphData.size} nodes. Root ID: ${rootInternalId}. Rendering...`);
    
    render(myGraphData, rootInternalId, cohortPeerIds || new Set());
  }, [filters]);

  // SAKURA: handleSearch function from main.js (adapted for React)
  function handleSearch(event) {
    event.preventDefault();
    
    if (!searchQuery) return;
    
    console.log(`Searching for name: ${searchQuery}`);
    const mrauth_id = findIdByName(searchQuery);
    
    if (mrauth_id) {
      setCurrentMrauthId(mrauth_id);
      buildRenderGraph(mrauth_id, filters);
    } else {
      alert(`Cannot find a match for ${searchQuery}`);
    }
  }

  // SAKURA: filter change handler
  function handleFilterChange(newFilters) {
    console.log("Filters updated:", newFilters);
    setFilters(newFilters);
  }

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
  }, [buildRenderGraph, filters]);

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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Dio Lewis Holl"
              autoComplete="off"
              disabled={isLoading}
            />
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
          <svg><g/></svg>
        </div>
        
        <FilterPanel onFilterChange={handleFilterChange} />
      </div>
      
      <div id="stats-panel"></div>
    </div>
  );
}

export default Graph;
