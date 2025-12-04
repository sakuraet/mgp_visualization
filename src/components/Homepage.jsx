import React from 'react';
import Graph from './Graph';  
import './Homepage.css';

function Homepage() {
  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="homepage-title">Mathematics Genealogy Project</h1>
        </header>

        <Graph />

        <div className="info-section">
          <div className="info-card">
            <h3>Features</h3>
            <p>
              <strong>Hover</strong>: To learn more about a mathematician, hover over their node to see details such as
              their name, thesis, institution, and year of graduation.
            </p>
            <p>
              <strong>Click</strong>: To focus the tree on a specific mathematician, click on their node to center the visualization
              around them, which will display their advisors, cohort peers (students of the same advisor), and students.
            </p>
            <p>
              <strong>Search Bar</strong>: To search for a mathematician, 
              enter their name in the search bar located at the top of the visualization.
            </p>
            <p>
              <strong>Filter Options</strong>: To filter for mathematicians based on the year or
              institution they got their graduate degree from, use the filter options located on the right.
              The filter bar can also be used to show or hide advisors, cohort peers, and students.
            </p>
            <p>
              <strong>Color Gradient</strong>: To make the relationships easy to identify, a mathematician's{' '}
              <span style={{ color: '#2d5016', fontWeight: 'bold' }}>advisor</span> nodes use a darker shade,{' '}
              <span style={{ color: '#5e734e', fontWeight: 'bold' }}>cohort peer</span> and{' '}
              <span style={{ color: '#5e734e', fontWeight: 'bold' }}>focus</span> nodes use a medium shade, and{' '}
              <span style={{ color: '#9dc183', fontWeight: 'bold' }}>student</span> nodes use a lighter shade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Homepage
