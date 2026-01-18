import { useState, useEffect } from 'react'
import './App.css'
import { AnalyzePage } from './AnalyzePage'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analyze'>('home')

  useEffect(() => {
    if (currentPage === 'home') {
      document.body.classList.add('home-page-active')
      document.documentElement.classList.add('home-page-active')
    } else {
      document.body.classList.remove('home-page-active')
      document.documentElement.classList.remove('home-page-active')
    }
    return () => {
      document.body.classList.remove('home-page-active')
      document.documentElement.classList.remove('home-page-active')
    }
  }, [currentPage])

  if (currentPage === 'analyze') {
    return <AnalyzePage onBack={() => setCurrentPage('home')} />
  }

  // Home Page
  return (
    <div id="page" className="primary home-page">
      <div id="top">
        <a id="Home" className="active">Home</a>
        <a id="Analyze" onClick={() => setCurrentPage('analyze')} style={{ cursor: 'pointer' }}>Analyze</a>
      </div>
      
      <div className="home-content">
        <h1 className="home-title">
          DashGuardian
        </h1>
        <p className="home-subtitle">
          AI-powered dashcam analysis
        </p>
        <button
          className="home-button"
          onClick={() => setCurrentPage('analyze')}
        >
          Start Analyzing
        </button>
      </div>
    </div>
  )
}

export default App
