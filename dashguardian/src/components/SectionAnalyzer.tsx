import type { VideoSection, SectionDescription } from '../types'
import { SectionDescriptions } from './SectionDescriptions'

interface SectionAnalyzerProps {
  sections: VideoSection[] | null
  sectionDescriptions: SectionDescription[]
  isDescribing: boolean
  detectedFault?: 'victim' | 'offender' | 'witness'
}

export function SectionAnalyzer({
  sections,
  sectionDescriptions,
  isDescribing,
  detectedFault
}: SectionAnalyzerProps) {
  const getPerspectiveColor = (fault?: string) => {
    switch (fault) {
      case 'offender':
        return '#ef5350'
      case 'witness':
        return '#7c4dff'
      default:
        return '#64b5f6'
    }
  }

  // Check if all descriptions are complete
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
  
  // Show loading state if analysis is in progress
  const showLoading = isDescribing || (sectionDescriptions.length > 0 && !hasAllDescriptions)

  // Don't render if no sections or if we haven't started describing yet
  if (!sections || (sectionDescriptions.length === 0 && !isDescribing)) {
    return null
  }

  const perspectiveColor = getPerspectiveColor(detectedFault)

  return (
    <div className="section-analyzer">
      <div className="section-analyzer-scroll-container">
        {/* Header Page */}
        <div className="section-analyzer-page section-analyzer-header">
          <div className="section-analyzer-content">
            <h1
              className="section-analysis-title"
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: perspectiveColor,
                fontFamily: '"Google Sans", sans-serif',
                margin: 0,
                marginBottom: '20px'
              }}
            >
              Section Analysis
            </h1>
            {showLoading && (
              <p
                style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: '"Google Sans", sans-serif',
                  margin: 0
                }}
              >
                ⏳ Analyzing sections...
              </p>
            )}
          </div>
        </div>

        {/* Individual Section Pages - Only show when all descriptions are complete */}
        {hasAllDescriptions &&
          sections.map((section) => {
            const desc = sectionDescriptions.find((d) => d.section === section.name)
            if (!desc) return null

            return (
              <div
                key={section.name}
                className="section-analyzer-page section-analyzer-section-page"
              >
                <div className="section-analyzer-content">
                  <SectionDescriptions
                    sections={[section]}
                    descriptions={[desc]}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
