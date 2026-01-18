import type { VideoSection, SectionDescription, StructuredSectionDescription } from '../types'
import '../App.css'

interface SectionDescriptionsProps {
  sections: VideoSection[]
  descriptions: SectionDescription[]
}

export function SectionDescriptions({ sections, descriptions }: SectionDescriptionsProps) {
  return (
    <div>
      {sections.map((section) => {
        const desc = descriptions.find((d) => d.section === section.name)
        return (
          <div key={section.name}>
            <div className="title">
              {section.name === 'event' ? ' ' : ''}
              {section.label}
              <span className="component-section-timestamp">
                ({section.start.toFixed(1)}s - {section.end.toFixed(1)}s)
              </span>
            </div>

            {desc?.isLoading ? (
              <div className="text">Analyzing this section...</div>
            ) : desc?.error ? (
              <div className="text">Error: {desc.error}</div>
            ) : desc?.description ? (
              typeof desc.description === 'string' ? (
                <div className="component-body-text-pre">{desc.description}</div>
              ) : (
                <div>
                  {Object.entries(desc.description as StructuredSectionDescription).map(([header, body]) => (
                    <div key={header}>
                      <div className="header">{header}</div>
                      <div className="text"><li className="text">{body}</li></div>
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
