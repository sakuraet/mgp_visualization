import React from 'react'
import './Navigation.css'

function Navigation({ currentPage, onPageChange }) {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <span className="logo-text">Mathematics Genealogy Project</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onPageChange('home')}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => onPageChange('about')}
          >
            About
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
