import type { AggregatedResults } from '../types'

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
    <div
      style={{
        display: 'inline-flex',
        padding: '12px 20px',
        backgroundColor: 'transparent',
        borderRadius: '12px',
        borderLeft: '4px solid rgba(255, 255, 255, 0.3)',
        marginBottom: '8px',
        gap: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: '"Google Sans", sans-serif'
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Collision:
        </span>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#fff',
            fontFamily: '"Google Sans", sans-serif'
          }}
        >
          {results.medianTime.toFixed(1)}s
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: '"Google Sans", sans-serif'
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Window:
        </span>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#fff',
            fontFamily: '"Google Sans", sans-serif'
          }}
        >
          {results.medianWindow[0].toFixed(1)}s - {results.medianWindow[1].toFixed(1)}s
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: '"Google Sans", sans-serif'
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Perspective:
        </span>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: getPerspectiveColor(results.detectedFault),
            fontFamily: '"Google Sans", sans-serif',
            textTransform: 'capitalize'
          }}
        >
          {results.detectedFault}
        </span>
      </div>

      {videoDuration && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"Google Sans", sans-serif'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Duration:
          </span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              fontFamily: '"Google Sans", sans-serif'
            }}
          >
            {videoDuration.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  )
}
