import React, { useState } from 'react'
import Navigation from './components/Navigation'
import Homepage from './components/Homepage'
import About from './components/About'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <div className="App">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="page-content">
        {currentPage === 'home' ? <Homepage /> : <About />}
      </div>
    </div>
  )
}

export default App
