import type { AggregatedResults } from '../types'

interface AnalysisResultsSummaryProps {
  results: AggregatedResults
  videoDuration: number | null
}

export function AnalysisResultsSummary({ results, videoDuration }: AnalysisResultsSummaryProps) {
  return (
    <div
      style={{
        marginBottom: '15px',
        padding: '12px',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: '6px',
        border: '1px solid rgba(76, 175, 80, 0.3)'
      }}
    >
      <p style={{ margin: '5px 0', color: 'inherit' }}>
        <strong>Median Collision Time:</strong>{' '}
        <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#66bb6a' }}>
          {results.medianTime.toFixed(1)}s
        </span>
      </p>
      <p style={{ margin: '5px 0', color: 'inherit' }}>
        <strong>Median Window:</strong>{' '}
        <span style={{ fontWeight: 'bold' }}>
          [{results.medianWindow[0].toFixed(1)}s - {results.medianWindow[1].toFixed(1)}s]
        </span>
      </p>
      <p style={{ margin: '5px 0', color: 'inherit' }}>
        <strong>Detected Perspective:</strong>{' '}
        <span
          style={{
            fontWeight: 'bold',
            textTransform: 'capitalize',
            color: results.detectedFault === 'offender' ? '#ef5350' : '#64b5f6'
          }}
        >
          {results.detectedFault}
        </span>
      </p>
      {videoDuration && (
        <p style={{ margin: '5px 0', color: 'rgba(255,255,255,0.6)' }}>
          <strong>Video Duration:</strong> {videoDuration.toFixed(1)}s
        </p>
      )}
    </div>
  )
}
