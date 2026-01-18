import type { VideoSection, SectionDescription, StructuredSectionDescription } from '../types'

interface SectionDescriptionsProps {
  sections: VideoSection[]
  descriptions: SectionDescription[]
}

const BORDER_COLORS = {
  ante: '#fff',
  event: '#fff',
  post: '#fff'
}

const BG_COLORS = {
  ante: 'rgba(255, 255, 255, 0.1)',
  event: 'rgba(255, 255, 255, 0.1)',
  post: 'rgba(255, 255, 255, 0.1)'
}

const HEADER_COLORS = {
  ante: '#fff',
  event: '#fff',
  post: '#fff'
}

export function SectionDescriptions({ sections, descriptions }: SectionDescriptionsProps) {
  return (
    <div>
      {sections.map((section) => {
        const desc = descriptions.find((d) => d.section === section.name)
        return (
          <div
            key={section.name}
            style={{
              marginBottom: '15px',
              padding: '30px',
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
                marginBottom: '20px'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: HEADER_COLORS[section.name],
                  fontSize: '32px',
                  fontWeight: 600,
                  fontFamily: '"Google Sans", sans-serif'
                }}
              >
                {section.name === 'event' ? '⚡ ' : ''}
                {section.label}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.5)',
                    marginLeft: '15px',
                    fontFamily: '"Google Sans", sans-serif'
                  }}
                >
                  ({section.start.toFixed(1)}s - {section.end.toFixed(1)}s)
                </span>
              </h2>
            </div>

            {desc?.isLoading ? (
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontStyle: 'italic',
                  margin: 0,
                  fontSize: '18px',
                  fontFamily: '"Google Sans", sans-serif'
                }}
              >
                ⏳ Analyzing this section...
              </p>
            ) : desc?.error ? (
              <p
                style={{
                  color: '#fff',
                  margin: 0,
                  fontSize: '18px',
                  fontFamily: '"Google Sans", sans-serif'
                }}
              >
                ❌ Error: {desc.error}
              </p>
            ) : desc?.description ? (
              typeof desc.description === 'string' ? (
                <p
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0,
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    fontSize: '18px',
                    fontFamily: '"Google Sans", sans-serif'
                  }}
                >
                  {desc.description}
                </p>
              ) : (
                <div>
                  {Object.entries(desc.description as StructuredSectionDescription).map(([header, body]) => (
                    <div key={header} style={{ marginBottom: '24px' }}>
                      <h3
                        style={{
                          margin: 0,
                          marginBottom: '12px',
                          color: '#fff',
                          fontSize: '20px',
                          fontWeight: 600,
                          fontFamily: '"Google Sans", sans-serif'
                        }}
                      >
                        {header}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          color: 'rgba(255,255,255,0.9)',
                          lineHeight: '1.8',
                          fontSize: '18px',
                          fontFamily: '"Google Sans", sans-serif'
                        }}
                      >
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
