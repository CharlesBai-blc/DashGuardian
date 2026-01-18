import './App.css'
import { VideoAnalyzer } from './VideoAnalyzer'

interface AnalyzePageProps {
  onBack: () => void
}

export function AnalyzePage({ onBack }: AnalyzePageProps) {
  return (
    <div id="page" className="primary">
      <div id="top">
        <a id="Home" onClick={onBack} style={{ cursor: 'pointer' }}>
          <img id="logo" src="LogoWhite.png"  style={{left: 'auto', right: '0px', top: '25px', opacity: '.8'}} alt="DashGuardian Logo"/>
        </a>
      </div>
      
      <div id="main">
        <VideoAnalyzer />
      </div>
    </div>
  )
}
