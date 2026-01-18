import type { VideoSection, SectionDescription } from '../types'

interface SectionDescriptionsProps {
  sections: VideoSection[]
  descriptions: SectionDescription[]
}

const BORDER_COLORS = {
  ante: '#1e88e5',
  event: '#e53935',
  post: '#43a047'
}

const BG_COLORS = {
  ante: 'rgba(30, 136, 229, 0.1)',
  event: 'rgba(229, 57, 53, 0.1)',
  post: 'rgba(67, 160, 71, 0.1)'
}

const HEADER_COLORS = {
  ante: '#64b5f6',
  event: '#ef5350',
  post: '#81c784'
}

export function SectionDescriptions({ sections, descriptions }: SectionDescriptionsProps) {
  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ marginBottom: '15px', color: 'inherit' }}>Section Descriptions</h4>
      {sections.map((section) => {
        const desc = descriptions.find((d) => d.section === section.name)
        return (
          <div
            key={section.name}
            style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: BG_COLORS[section.name],
              borderLeft: `4px solid ${BORDER_COLORS[section.name]}`,
              borderRadius: '0 8px 8px 0'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}
            >
              <h5
                style={{
                  margin: 0,
                  color: HEADER_COLORS[section.name],
                  fontSize: '1.1em'
                }}
              >
                {section.name === 'event' ? '⚡ ' : ''}
                {section.label}
                <span
                  style={{
                    fontWeight: 'normal',
                    fontSize: '0.85em',
                    color: 'rgba(255,255,255,0.5)',
                    marginLeft: '10px'
                  }}
                >
                  ({section.start.toFixed(1)}s - {section.end.toFixed(1)}s)
                </span>
              </h5>
            </div>

            {desc?.isLoading ? (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: 0 }}>
                ⏳ Analyzing this section...
              </p>
            ) : desc?.error ? (
              <p style={{ color: '#ef5350', margin: 0 }}>❌ Error: {desc.error}</p>
            ) : desc?.description ? (
              <p
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  margin: 0,
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {desc.description}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
