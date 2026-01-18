import { useState } from 'react'
import './App.css'
import { AnalyzePage } from './AnalyzePage'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analyze'>('home')

  if (currentPage === 'analyze') {
    return <AnalyzePage onBack={() => setCurrentPage('home')} />
  }

  // Home Page
  return (
    <div id="page" className="primary">
      <div id="top">
        <a id="Home" className="active">Home</a>
        <a id="Analyze" onClick={() => setCurrentPage('analyze')} style={{ cursor: 'pointer' }}>Analyze</a>
      </div>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 70px)',
          marginTop: '70px'
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#fff',
            fontFamily: '"Google Sans", sans-serif',
            marginBottom: '20px'
          }}
        >
          DashGuardian
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontFamily: '"Google Sans", sans-serif',
            marginBottom: '40px'
          }}
        >
          AI-powered dashcam analysis
        </p>
        <button
          onClick={() => setCurrentPage('analyze')}
          style={{
            padding: '16px 40px',
            fontSize: '18px',
            fontWeight: 600,
            backgroundColor: '#7c4dff',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: '"Google Sans", sans-serif'
          }}
        >
          Start Analyzing
        </button>
      </div>
    </div>
  )
}

export default App
