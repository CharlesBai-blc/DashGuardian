import type { VideoSection, SectionDescription, StructuredSectionDescription } from '../types'
import './components.css'

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
            className="component-card-section"
            style={{
              backgroundColor: BG_COLORS[section.name],
              borderLeftColor: BORDER_COLORS[section.name]
            }}
          >
            <div className="component-flex-between component-margin-bottom">
              <h2 className="component-heading-2" style={{ color: HEADER_COLORS[section.name] }}>
                {section.name === 'event' ? '⚡ ' : ''}
                {section.label}
                <span className="component-section-timestamp">
                  ({section.start.toFixed(1)}s - {section.end.toFixed(1)}s)
                </span>
              </h2>
            </div>

            {desc?.isLoading ? (
              <p className="component-loading-text-italic">⏳ Analyzing this section...</p>
            ) : desc?.error ? (
              <p className="component-error-text">❌ Error: {desc.error}</p>
            ) : desc?.description ? (
              typeof desc.description === 'string' ? (
                <p className="component-body-text-pre">{desc.description}</p>
              ) : (
                <div>
                  {Object.entries(desc.description as StructuredSectionDescription).map(([header, body]) => (
                    <div key={header} className="component-margin-bottom-sm">
                      <h3 className="component-heading-4">{header}</h3>
                      <p className="component-body-text">{body}</p>
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
