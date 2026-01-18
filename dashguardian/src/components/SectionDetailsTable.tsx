import type { VideoSection } from '../types'

interface SectionDetailsTableProps {
  sections: VideoSection[]
}

const ROW_COLORS = {
  ante: 'rgba(30, 136, 229, 0.15)',
  event: 'rgba(229, 57, 53, 0.15)',
  post: 'rgba(67, 160, 71, 0.15)'
}

const TEXT_COLORS = {
  ante: '#64b5f6',
  event: '#ef5350',
  post: '#81c784'
}

export function SectionDetailsTable({ sections }: SectionDetailsTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
      <thead>
        <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <th
            style={{
              padding: '10px',
              textAlign: 'left',
              color: 'inherit',
              borderBottom: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            Section
          </th>
          <th
            style={{
              padding: '10px',
              textAlign: 'left',
              color: 'inherit',
              borderBottom: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            Start
          </th>
          <th
            style={{
              padding: '10px',
              textAlign: 'left',
              color: 'inherit',
              borderBottom: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            End
          </th>
          <th
            style={{
              padding: '10px',
              textAlign: 'left',
              color: 'inherit',
              borderBottom: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            Duration
          </th>
        </tr>
      </thead>
      <tbody>
        {sections.map((section) => (
          <tr
            key={section.name}
            style={{
              backgroundColor: ROW_COLORS[section.name],
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <td
              style={{
                padding: '10px',
                fontWeight: section.name === 'event' ? 'bold' : 'normal',
                color: TEXT_COLORS[section.name]
              }}
            >
              {section.name === 'event' ? '⚡ ' : ''}
              {section.label}
            </td>
            <td style={{ padding: '10px', color: 'inherit' }}>{section.start.toFixed(1)}s</td>
            <td style={{ padding: '10px', color: 'inherit' }}>{section.end.toFixed(1)}s</td>
            <td style={{ padding: '10px', color: 'inherit' }}>{section.duration.toFixed(1)}s</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
