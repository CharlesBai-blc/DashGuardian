import type { VideoSection, SectionDescription, StructuredSectionDescription } from '../types'
import '../App.css'

interface SectionAnalyzerProps {
  sections: VideoSection[] | null
  sectionDescriptions: SectionDescription[]
}

export function SectionAnalyzer({
  sections,
  sectionDescriptions,
}: SectionAnalyzerProps) {
  const hasAllDescriptions = 
    sectionDescriptions.length === 3 && 
    sectionDescriptions.every((desc) => {
      if (desc.isLoading) return false
      if (typeof desc.description === 'string') {
        return desc.description.length > 0
      }
      if (typeof desc.description === 'object' && desc.description !== null) {
        return Object.keys(desc.description).length > 0
      }
      return false
    })

  if (!sections || !hasAllDescriptions) {
    return null
  }

  const sectionOrder: Array<'ante' | 'event' | 'post'> = ['ante', 'event', 'post']

  return (
    <>
      {sectionOrder.map((sectionName) => {
        const section = sections.find((s) => s.name === sectionName)
        const desc = sectionDescriptions.find((d) => d.section === sectionName)
        if (!section || !desc) return null

        return (
          <div key={sectionName} className="section-analysis-page">
            <div className="section-analysis-content">
              <div className="title" style={{ margin: 0, marginBottom: '8px' }}>{section.label}</div>
              <div className="text" style={{ margin: 0, marginBottom: '40px', opacity: 0.5 }}>
                {section.start.toFixed(1)}s - {section.end.toFixed(1)}s
              </div>
              
              {typeof desc.description === 'string' ? (
                <div className="text" style={{ margin: 0 }}>{desc.description}</div>
              ) : (
                Object.entries(desc.description as StructuredSectionDescription).map(([header, body]) => (
                  <div key={header} style={{ marginBottom: '24px' }}>
                    <div className="header" style={{ margin: 0, marginBottom: '8px', color: '#90cdf4' }}>{header}</div>
                    <div className="text" style={{ margin: 0 }}>{body}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
