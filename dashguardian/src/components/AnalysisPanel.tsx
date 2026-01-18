import type { AggregatedResults, VideoSection } from '../types'
import { AnalysisResultsSummary } from './AnalysisResultsSummary'

interface AnalysisPanelProps {
  selectedFile: File | null
  results: AggregatedResults | null
  sections: VideoSection[] | null
  videoDuration: number | null
  isLoading: boolean
  onAnalyze: () => void
}

export function AnalysisPanel({
  selectedFile,
  results,
  videoDuration,
  isLoading,
  onAnalyze
}: AnalysisPanelProps) {
  // Empty state: no file selected
  if (!selectedFile) {
    return (
      <div style={{ padding: '30px' }}>
        <div className="title">Dashcam Analyzer</div>
        <div className="text" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Upload a dashcam video to begin analysis
        </div>
      </div>
    )
  }

  // File selected but no results yet
  if (!results) {
    return (
      <div style={{ padding: '30px' }}>
        <div className="title">Dashcam Analyzer</div>
        <div className="text">
          Video loaded and ready for analysis. Click the button below to detect collision events.
        </div>
        <div style={{ margin: '30px' }}>
          <button
            onClick={onAnalyze}
            disabled={isLoading}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 600,
              backgroundColor: isLoading ? '#555' : '#fff',
              color: '#000',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: '"Google Sans", sans-serif',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
            }}
          >
            {isLoading ? '⏳ Analyzing video...' : 'Analyze Video'}
          </button>
        </div>
      </div>
    )
  }

  // Results available - single page summary
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '30px'
      }}
    >
      <div className="title" style={{ margin: 0, marginBottom: '20px' }}>
        Analysis Results
      </div>

      <AnalysisResultsSummary results={results} videoDuration={videoDuration} />

      {/* Summary Text - Only show when both timing info and summary are ready */}
      {results.summary && (
        <div
          style={{
            marginTop: '5px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            borderLeft: '4px solid #fff'
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: '15px',
              color: '#fff',
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '24px',
              fontWeight: 600
            }}
          >
            Incident Summary
          </h3>
          <p
            style={{
              margin: 0,
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '16px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}
          >
            {results.summary}
          </p>
        </div>
      )}
    </div>
  )
}
