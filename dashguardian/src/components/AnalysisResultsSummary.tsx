import type { AggregatedResults } from '../types'
import '../App.css'

interface AnalysisResultsSummaryProps {
  results: AggregatedResults
  videoDuration: number | null
}

export function AnalysisResultsSummary({ results, videoDuration }: AnalysisResultsSummaryProps) {
  const getPerspectiveColor = (fault: string) => {
    switch (fault) {
      case 'offender':
        return '#ef5350'
      case 'witness':
        return '#7c4dff'
      default:
        return '#64b5f6'
    }
  }

  return (
    <div>
      <div className="text">
        <span className="stat-item-label">Collision:  </span>
        <span className="stat-item-value">{results.medianTime.toFixed(1)}s</span>
      </div>

      <div className="text">
        <span className="stat-item-label">Window:  </span>
        <span className="stat-item-value">
          {results.medianWindow[0].toFixed(1)}s - {results.medianWindow[1].toFixed(1)}s
        </span>
      </div>

      <div className="text">
        <span className="stat-item-label">Perspective:  </span>
        <span
          className="stat-item-value-colored"
          style={{ color: getPerspectiveColor(results.detectedFault) }}
        >
          {results.detectedFault}
        </span>
      </div>

      {videoDuration && (
        <div className="text">
          <span className="stat-item-label">Duration:  </span>
          <span className="stat-item-value">{videoDuration.toFixed(1)}s</span>
        </div>
      )}
    </div>
  )
}
