import React, { useState } from 'react';
import './FilterPanel.css';
import { getUniversitySuggestions } from '../graph-data';



function FilterPanel({ onFilterChange }) {
    const [filters, setFilters] = useState({
        university: '',
        yearMin: 1800,
        yearMax: 2024,
        showAdvisors: true,
        showCohortPeers: true,
        showStudents: true
    });

const [universitySuggestions, setUniversitySuggestions] = useState([]);
const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

//KEVIN: handle university input with fuzzysearch 

const handleUniversityChange = (e) => {
        const value = e.target.value;
        
        // anne: update local filter value only
        const newFilters = { ...filters, university: value };
        setFilters(newFilters);
        
        if (value.length > 2) {
            try {
                const results = getUniversitySuggestions(value);
                setUniversitySuggestions(results.slice(0, 10)); // Limit to 10 suggestions
                setShowUniversitySuggestions(results.length > 0);
            } catch (err) {
                console.error("[university autocomplete] error:", err);
                setUniversitySuggestions([]);
                setShowUniversitySuggestions(false);
            }
        } else {
            setUniversitySuggestions([]);
            setShowUniversitySuggestions(false);
        }
    };

    // KEVIN: handles the click for university search
    const handleSuggestionClick = (suggestionName) => {
        const newFilters = { ...filters, university: suggestionName };
        setFilters(newFilters);
        setUniversitySuggestions([]);
        setShowUniversitySuggestions(false);
    };

    // the blur for the search
    const handleBlur = () => {
        // Delay hiding to allow click event on suggestion to fire first
        setTimeout(() => {
            setShowUniversitySuggestions(false);
        }, 200);
    };

    // anne: apply filters button handler
    const handleApplyFilters = () => {
        onFilterChange(filters);
    };

    return (
   <div className="filter-panel">
            <h3>Filters</h3>
            <div className="filter-group">
                <label>University:</label>
                {/* SAKURA: Autocomplete wrapper for university input */}
                <div className="autocomplete-wrapper" style={{ width: '100%' }}>
                    <input
                        type="text"
                        value={filters.university}
                        onChange={handleUniversityChange}
                        onBlur={handleBlur}
                        onFocus={() => filters.university.length > 1 && setShowUniversitySuggestions(true)}
                        placeholder="e.g., University of Hawaii"
                    />
                    {showUniversitySuggestions && universitySuggestions.length > 0 && (
                        <div className="suggestions-dropdown" style={{ minWidth: '100%' }}>
                            {universitySuggestions.map((s, index) => (
                                <div 
                                    key={`${s.name}-${index}`} 
                                    className="suggestion-item"
                                    // Use onMouseDown to prevent the input's onBlur from firing before the click
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevents blur event
                                        handleSuggestionClick(s.name);
                                    }}
                                    onClick={() => handleSuggestionClick(s.name)} // Fallback for click
                                >
                                    <span className="suggestion-name">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="filter-group">
                <label>Year Awarded:</label>
                <div className="range-inputs">
                    <input
                        type="number"
                        value={filters.yearMin}
                        onChange={(e) => handleFilterChange('yearMin', parseInt(e.target.value))}
                        min="1800"
                        max={filters.yearMax}
                        placeholder="Min"
                    />
                    <span>to</span>
                    <input
                        type="number"
                        value={filters.yearMax}
                        onChange={(e) => handleFilterChange('yearMax', parseInt(e.target.value))}
                        min={filters.yearMin}
                        max="2024"
                        placeholder="Max"
                    />
                </div>
            </div>

            {/* anne: legend */}
            <div className="legend-section">
                <h4>Node Color Legend</h4>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#2d5016' }}></span>
                    <span className="legend-label">Advisors</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#5e734e' }}></span>
                    <span className="legend-label">Cohort Peers & Focus</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#9dc183' }}></span>
                    <span className="legend-label">Students</span>
                </div>
            </div>

            <div className="filter-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={filters.showAdvisors}
                        onChange={(e) => handleFilterChange('showAdvisors', e.target.checked)}
                    />
                    Show Advisors
                </label>
            </div>

            <div className="filter-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={filters.showCohortPeers}
                        onChange={(e) => handleFilterChange('showCohortPeers', e.target.checked)}
                    />
                    Show Cohort Peers
                </label>
            </div>

            <div className="filter-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={filters.showStudents}
                        onChange={(e) => handleFilterChange('showStudents', e.target.checked)}
                    />
                    Show Students
                </label>
            </div>

            {/* anne: apply filters button */}
            <button 
                className="apply-button"
                onClick={handleApplyFilters}
            >
                Apply Filters
            </button>

            {/* SAKURA: reset button */}
            <button 
                className="reset-button"
                onClick={() => {
                    const defaultFilters = {
                        university: '',
                        yearMin: 1800,
                        yearMax: 2024,
                        showAdvisors: true,
                        showCohortPeers: true,
                        showStudents: true
                    };
                    setFilters(defaultFilters);
                    onFilterChange(defaultFilters);
                }}
            >
                Reset Filters
            </button>
        </div>
    );
}

export default FilterPanel;