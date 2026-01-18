import './App.css'
import { VideoAnalyzer } from './VideoAnalyzer'

interface AnalyzePageProps {
  onBack: () => void
}

export function AnalyzePage({ onBack }: AnalyzePageProps) {
  return (
    <div id="page" className="primary">
      <div id="top">
        <a id="Home" onClick={onBack} style={{ cursor: 'pointer' }}>Home</a>
        <a id="Analyze" className="active">Analyze</a>
      </div>
      
      <div id="main">
        <VideoAnalyzer />
      </div>
    </div>
  )
}
