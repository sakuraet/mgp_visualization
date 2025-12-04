import React, { useState } from 'react';
import './FilterPanel.css';

function FilterPanel({ onFilterChange }) {
    const [filters, setFilters] = useState({
        university: '',
        yearMin: 1800,
        yearMax: 2024,
        showAdvisors: true,
        showCohortPeers: true,
        showStudents: true
    });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="filter-panel">
            <h3>Filters</h3>
            <div className="filter-group">
                <label>University:</label>
                <input
                    type="text"
                    value={filters.university}
                    onChange={(e) => handleFilterChange('university', e.target.value)}
                    placeholder="e.g., MIT"
                />
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
                {/* SAKURA: cohort peers = people with same advisor */}
                {filters.showCohortPeers && (
                    <small style={{ display: 'block', marginLeft: '1.5rem', marginTop: '0.5rem', color: '#777', fontSize: '0.8rem' }}>
                        Same year & institution
                    </small>
                )}
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