import React from 'react'
import './SearchResults.css'

function SearchResults({ results, onBack }) {
  if (!results || results.length === 0) {
    return (
      <div className="search-results">
        <div className="results-container">
          <button onClick={onBack} className="back-button">← Back to Search</button>
          <div className="no-results">
            <h2>No results found</h2>
            <p>Try adjusting your search criteria</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="search-results">
      <div className="results-container">
        <div className="results-header">
          <button onClick={onBack} className="back-button">← Back to Search</button>
          <h2 className="results-title">Search Results ({results.length})</h2>
        </div>

        <div className="results-grid">
          {results.map((person, index) => (
            <div key={person.id || index} className="result-card">
              <div className="result-header">
                <h3 className="result-name">
                  {person.given_name} {person.family_name}
                </h3>
                <span className="result-id">ID: {person.id}</span>
              </div>
              
              <div className="result-details">
                {person.school && (
                  <div className="detail-item">
                    <span className="detail-label">Institution:</span>
                    <span className="detail-value">{person.school}</span>
                  </div>
                )}
                
                {person.year && (
                  <div className="detail-item">
                    <span className="detail-label">Year:</span>
                    <span className="detail-value">{person.year}</span>
                  </div>
                )}
                
                {person.thesis && (
                  <div className="detail-item">
                    <span className="detail-label">Thesis:</span>
                    <span className="detail-value">{person.thesis}</span>
                  </div>
                )}

                {person.country && (
                  <div className="detail-item">
                    <span className="detail-label">Country:</span>
                    <span className="detail-value">{person.country}</span>
                  </div>
                )}
              </div>

              <button className="view-details-button">
                View Full Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SearchResults
