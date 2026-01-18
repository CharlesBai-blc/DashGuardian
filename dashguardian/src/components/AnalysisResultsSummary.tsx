import type { AggregatedResults } from '../types'
import '../App.css'

interface AnalysisResultsSummaryProps {
  results: AggregatedResults
}

export function AnalysisResultsSummary({ results }: AnalysisResultsSummaryProps) {
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
    <div className="text" style={{ marginBottom: '90px', fontSize: '20px', textAlign: 'center', marginTop: '70px'}}>
      <span className="stat-item-label">Perspective: </span>
      <span
        className="stat-item-value-colored"
        style={{ color: getPerspectiveColor(results.detectedFault), fontWeight: 600 }}
      >
        {results.detectedFault.toUpperCase()}
      </span>
    </div>
  )
}
