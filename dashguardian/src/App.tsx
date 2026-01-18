import { useState, useEffect, useRef } from 'react'
import './App.css'
import { AnalyzePage } from './AnalyzePage'
import { InfoPage } from './InfoPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analyze'>('home')
  const [canScroll, setCanScroll] = useState(false)
  const timerRef = useRef<number | null>(null)

  // Enable scrolling after button animation (1.8s delay + 0.8s duration = 2.6s)
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (currentPage === 'home') {
      setTimeout(() => setCanScroll(false), 0)
      timerRef.current = window.setTimeout(() => {
        setCanScroll(true)
        timerRef.current = null
      }, 2600)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentPage])

  // Control scroll container
  useEffect(() => {
    const container = document.querySelector('.home-scroll-container') as HTMLElement
    if (container) {
      container.style.overflowY = canScroll ? 'auto' : 'hidden'
    }
  }, [canScroll])

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
      
      <div className="home-scroll-container">
        <div className="home-content">
          <h1 className="home-title">
            Dash<span style={{ color: '#90cdf4' }}>Guardian</span>
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
        <InfoPage />
      </div>
    </div>
  )
}

export default App
