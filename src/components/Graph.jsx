import React, { useEffect, useRef, useState } from 'react';
import { render } from '../graph.js';
import { loadData, findIdByName, created } from '../graph-data.js';
import './Graph.css';

function Graph() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedData = useRef(false);

  // SAKURA: buildRenderGraph function from main.js
  function buildRenderGraph(mrauth_id) {
    if (!mrauth_id) {
      console.error("No ID provided to render.");
      return;
    }
    
    console.log(`Building graph for mrauth_id: ${mrauth_id}`);
    
    // SAKURA: making subgraph data 
    const result = created(mrauth_id);
    
    if (!result) {
      console.error(`Failed to create graph data for ID: ${mrauth_id}`);
      return;
    }
    
    const { graphData: myGraphData, rootInternalId } = result;
    
    // SAKURA: verify we have both valid data and a valid root ID
    if (!myGraphData || myGraphData.size === 0) {
      console.error(`No graph data created for ID: ${mrauth_id}`);
      return;
    }
    
    if (!rootInternalId) {
      console.error(`No root internal ID found for ID: ${mrauth_id}`);
      return;
    }
    
    console.log(`Data loaded for ${myGraphData.size} nodes. Root ID: ${rootInternalId}. Rendering...`);
    
    // SAKURA: correct rootInternalId directly from the created() function
    render(myGraphData, rootInternalId);
  }

  // SAKURA: handleSearch function from main.js (adapted for React)
  function handleSearch(event) {
    event.preventDefault(); // stops the form from reloading the page
    
    if (!searchQuery) return; // we get nothing
    
    console.log(`Searching for name: ${searchQuery}`);
    const mrauth_id = findIdByName(searchQuery);
    
    // if the ID exists, then we should render the graph
    if (mrauth_id) {
      buildRenderGraph(mrauth_id);
    } else {
      alert(`Cannot find a match for ${searchQuery}`);
    }
  }

  // SAKURA: main() function from main.js (converted to useEffect)
  useEffect(() => {
    async function initializeData() {
      if (hasLoadedData.current) return;
      
      // load all data into memory
      console.log("Loading academic data...");
      await loadData();
      console.log("Data loaded.");
      
      // default render is The Dio Holl fella
      buildRenderGraph("462675");
      
      setIsLoading(false);
      hasLoadedData.current = true;
    }
    
    initializeData();
  }, []); // empty dependency array = runs once on mount (like main())

  return (
    <div className="graph-wrapper">
      <div className="search-section">
        {/* SAKURA: replaces the form with id="single_name_form" from main.js */}
        <form onSubmit={handleSearch} className="search-form">
          <label>
            Enter a name:
            {/* SAKURA: replaces the input with id="single_name_input" from main.js */}
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

      {/* SAKURA: container from HTML that D3 renders into */}
      <div id="container" style={{ display: isLoading ? 'none' : 'block' }}>
        <svg><g/></svg>
      </div>
      
      {/* SAKURA: stats panel that gets populated by graph.js for later? */}
      <div id="stats-panel"></div>
    </div>
  );
}

export default Graph;