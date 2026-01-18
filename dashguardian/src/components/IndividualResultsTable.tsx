import type { AnalysisResult } from '../types'

interface IndividualResultsTableProps {
  results: AnalysisResult[]
}

export function IndividualResultsTable({ results }: IndividualResultsTableProps) {
  return (
    <details style={{ marginTop: '10px' }}>
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 'bold',
          color: 'rgba(255,255,255,0.7)',
          padding: '8px 0'
        }}
      >
        Individual Results ({results.length} responses)
      </summary>
      <table
        style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', fontSize: '0.9em' }}
      >
        <thead>
          <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <th
              style={{
                padding: '8px',
                textAlign: 'left',
                color: 'inherit',
                borderBottom: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              #
            </th>
            <th
              style={{
                padding: '8px',
                textAlign: 'left',
                color: 'inherit',
                borderBottom: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Time (s)
            </th>
            <th
              style={{
                padding: '8px',
                textAlign: 'left',
                color: 'inherit',
                borderBottom: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Window
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <td style={{ padding: '8px', color: 'rgba(255,255,255,0.6)' }}>{i + 1}</td>
              <td style={{ padding: '8px', color: 'inherit' }}>{r.approx_t_s.toFixed(1)}</td>
              <td style={{ padding: '8px', color: 'inherit' }}>
                [{r.window_s[0].toFixed(1)} - {r.window_s[1].toFixed(1)}]
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
