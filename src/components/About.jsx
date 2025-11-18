import React from 'react'
import './About.css'
import SakuraImg from './AboutPics/Sakura.jpg'
import AnneImg from './AboutPics/Anne.jpg'
import KevinImg from './AboutPics/Kevin.png'

function About() {
  return (
    <div className="about">
      <div className="about-container">
        <header className="about-header">
          <h1 className="about-title">About Us & Our Project</h1>
        </header>

        <div className="about-content">
          <section className="about-section">
            <h2>About Us</h2>
            
            <div className="team-grid">
              <div className="team-member">
                <img 
                  src={KevinImg} 
                  alt="Kevin Phan" 
                  className="team-photo"
                />
                <h3>Kevin Phan</h3>
                <p className="team-role">Undergraduate Student in Mathematics & Economics</p>
                <p className="team-bio">
                  Constructed the node-link visualization and its features.
                </p>
              </div>

              <div className="team-member">
                <img 
                  src={SakuraImg}
                  alt="Sakura Takahashi" 
                  className="team-photo"
                />
                <h3>Sakura Takahashi</h3>
                <p className="team-role">Undergraduate Student in Mathematics</p>
                <p className="team-bio">
                  Obtained and cleaned the data for visualization.
                </p>
              </div>

              <div className="team-member">
                <img 
                  src={AnneImg}
                  alt="Anne Dominique Malig" 
                  className="team-photo"
                />
                <h3>Anne Dominique Malig</h3>
                <p className="team-role">Undergraduate Student in Mathematics</p>
                <p className="team-bio">
                  Created the website and its features.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>About Our Project</h2>
            <p>
              Univsersities bring together faculty from diverse academic
              and cultural backgrounds who mentor graduate students that
              go on to have their own careers. The goal of this project is
              to illustrate the mathematical genealogy across generations.
              By doing so, it highlights how interconnected mathematicians
              are throughout their vast academic network.
            </p>
          </section>

          <section className="about-section">
            <h2>About The Code</h2>
            <p>
              The code for this entire project, including data retrieval, data visualization, and 
              website creation, can be found in our{' '}
              <a 
                href="https://github.com/sakuraet/mgp_visualization" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-link"
              >
                GitHub repository
              </a>.
            </p>
          </section>

          <section className="about-section">
            <h2>About The Data</h2>
            <p>
              The data is obtained from the {' '}
              <a
                href="https://genealogy.math.ndsu.nodak.edu/"
                target="_blank"
                rel="noopener noreferrer"
                classname="mgp-link"
                >
                Mathematics Genealogy Project (MGP)
                </a>,
              a web-based database that documents the academic genealogy of mathematicians. 
              The MGP collects information on mathematicians' advisors, students, 
              institutions, and dissertation details. 
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default About
