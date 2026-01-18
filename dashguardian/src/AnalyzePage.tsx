import './App.css'
import { VideoAnalyzer } from './VideoAnalyzer'

interface AnalyzePageProps {
  onBack: () => void
}

export function AnalyzePage({ onBack: _onBack }: AnalyzePageProps) {
  return (
    <div id="page" className="primary">
      <div id="main">
        <VideoAnalyzer />
      </div>
    </div>
  )
}
