import React, { useState } from 'react'
import './Homepage.css'

function Homepage() {
  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="homepage-title">Mathematics Genealogy Project</h1>
        </header>

        <div className="visualization-card">
          <h2 className="viz-title">Academic Genealogy Network</h2>
          <div className="viz-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">📊</div>
              <h3>Node-Link Diagram</h3>
              <p>Interactive visualization will appear here</p>
              <div className="placeholder-details">
                <span>• Advisor-Student Relationships</span>
                <span>• Interactive Node Exploration</span>
                <span>• Dynamic Network Layout</span>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>Features</h3>
            <p>
              <strong>Search Bar</strong>: To search for a specific mathematician, 
              enter their name in the search bar located at the top of the visualization.
            </p>
            <p>
              <strong>Filter Options</strong>: To filter for specific mathematicians based on the year or
              institution they got their graduate degree from, use the filter options located on the right.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Homepage
