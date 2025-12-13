import React, { useState } from 'react';
import './FilterPanel.css';
import { getUniversitySuggestions } from '../graph-data';

function FilterPanel({ onFilterChange, viewMode, onViewModeChange }) {

    // local filter state (unchanged)
    const [filters, setFilters] = useState({
        university: '',
        yearMin: 1800,
        yearMax: 2024,
        showAdvisors: true,
        showCohortPeers: true,
        showStudents: true
    });

    // ⭐ NEW TEMP VIEW MODE — user sees toggle instantly, but it does NOT apply until clicking Apply Filters
    const [tempViewMode, setTempViewMode] = useState(viewMode);

    const [universitySuggestions, setUniversitySuggestions] = useState([]);
    const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

    // KEVIN: handle university input with fuzzysearch 
    const handleUniversityChange = (e) => {
        const value = e.target.value;

        // anne: update local filter value only
        const newFilters = { ...filters, university: value };
        setFilters(newFilters);

        if (value.length > 2) {
            try {
                const results = getUniversitySuggestions(value);
                setUniversitySuggestions(results.slice(0, 10)); 
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

    const handleSuggestionClick = (suggestionName) => {
        const newFilters = { ...filters, university: suggestionName };
        setFilters(newFilters);
        setUniversitySuggestions([]);
        setShowUniversitySuggestions(false);
    };

    const handleBlur = () => {
        setTimeout(() => setShowUniversitySuggestions(false), 200);
    };

    // ⭐ APPLY FILTERS NOW APPLIES BOTH FILTERS + TEMP VIEW MODE
    const handleApplyFilters = () => {
        onFilterChange(filters);
        onViewModeChange(tempViewMode);   // ⭐ VERY IMPORTANT
    };

    return (
        <div className="filter-panel">
            <h3>Filters</h3>

            {/* SAKURA: View Mode Toggle */}
            <div className="filter-group">
                <label>View Mode:</label>
                <div style={{ 
                    display: 'flex', 
                    gap: '5px', 
                    marginTop: '8px',
                    width: '100%' 
                }}>
                    <button
                        onClick={() => setTempViewMode('graph')}
                        style={{
                            flex: 1,
                            padding: '10px 8px',
                            backgroundColor: tempViewMode === 'graph' ? '#2d5016' : '#e0e0e0',
                            color: tempViewMode === 'graph' ? 'white' : '#333',
                            border: tempViewMode === 'graph' ? '2px solid #2d5016' : '2px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: tempViewMode === 'graph' ? 'bold' : 'normal',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Graph View
                    </button>

                    <button
                        onClick={() => setTempViewMode('map')}
                        style={{
                            flex: 1,
                            padding: '10px 8px',
                            backgroundColor: tempViewMode === 'map' ? '#2d5016' : '#e0e0e0',
                            color: tempViewMode === 'map' ? 'white' : '#333',
                            border: tempViewMode === 'map' ? '2px solid #2d5016' : '2px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: tempViewMode === 'map' ? 'bold' : 'normal',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Map View
                    </button>
                </div>
            </div>

            <div className="filter-group">
                <label>University:</label>
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
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSuggestionClick(s.name);
                                    }}
                                >
                                    <span className="suggestion-name">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Year Filter */}
            <div className="filter-group">
                <label>Year Awarded:</label>
                <div className="range-inputs">
                    <input
                        type="number"
                        value={filters.yearMin}
                        onChange={(e) => handleFilterChange('yearMin', parseInt(e.target.value))}
                        min="1800"
                        max={filters.yearMax}
                    />
                    <span>to</span>
                    <input
                        type="number"
                        value={filters.yearMax}
                        onChange={(e) => handleFilterChange('yearMax', parseInt(e.target.value))}
                        min={filters.yearMin}
                        max="2024"
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

            {/* Checkboxes */}
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

            {/* APPLY */}
            <button className="apply-button" onClick={handleApplyFilters}>
                Apply Filters
            </button>

            {/* RESET */}
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
