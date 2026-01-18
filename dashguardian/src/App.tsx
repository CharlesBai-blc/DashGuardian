import { useState, useEffect, useRef } from 'react'
import './App.css'
import { AnalyzePage } from './AnalyzePage'
import { MissionPage } from './components/MissionPage'
import { HelpPage1 } from './components/HelpPage1'
import { HelpPage2 } from './components/HelpPage2'
import { HelpPage3 } from './components/HelpPage3'

const brollVideos = ['/broll1.mp4', '/broll2.mp4'/*, '/broll3.mp4', '/broll4.mp4', '/broll5.mp4'*/]

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analyze'>('home')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const navigateTo = (page: 'home' | 'analyze') => {
    if (page === currentPage || isTransitioning) return
    setIsTransitioning(true)
    setCurrentPage(page)
    // Transition completes after CSS animation (500ms)
    setTimeout(() => setIsTransitioning(false), 500)
  }

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

  // Handle video looping
  useEffect(() => {
    const video = videoRef.current
    if (!video || currentPage !== 'home') return

    const handleVideoEnd = () => {
      setCurrentVideoIndex((prev) => (prev+1) % brollVideos.length)
    }

    video.addEventListener('ended', handleVideoEnd)
    video.src = brollVideos[currentVideoIndex]
    video.load()
    video.play().catch(() => {})

    return () => {
      video.removeEventListener('ended', handleVideoEnd)
    }
  }, [currentVideoIndex, currentPage])

  // Render both pages with CSS transitions
  return (
    <div className="page-container">
      {/* Animated Logo - exists outside page wrappers */}
      <a 
        className={`floating-logo ${currentPage === 'analyze' ? 'analyze-position' : 'home-position'}`}
        onClick={() => navigateTo(currentPage === 'home' ? 'analyze' : 'home')}
        style={{ cursor: 'pointer' }}
      >
        <img src="LogoWhite.png" alt="DashGuardian Logo"/>
      </a>

      {/* Home Page */}
      <div className={`page-wrapper ${currentPage === 'home' ? 'active' : 'inactive-left'}`}>
        <div id="page" className="primary home-page">
          <video
            ref={videoRef}
            className="home-background-video"
            autoPlay
            muted
            loop={false}
            playsInline
          />
          
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
                onClick={() => navigateTo('analyze')}
              >
                Dash to the Future
              </button>
            </div>
            <MissionPage />
            <HelpPage1 />
            <HelpPage2 />
            <HelpPage3 />
          </div>
        </div>
      </div>

      {/* Analyze Page */}
      <div className={`page-wrapper ${currentPage === 'analyze' ? 'active' : 'inactive-right'}`}>
        <AnalyzePage onBack={() => navigateTo('home')} />
      </div>
    </div>
  )
}

export default App
