import type { VideoSection, SectionDescription } from '../types'
import { SectionDescriptions } from './SectionDescriptions'
import '../App.css'

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
        return '#ed7674'
      case 'witness':
        return '#9f92c3'
      default:
        return '#90b9db'
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
    <div className="title">
      <div className="title">Analysis</div>
      {showLoading && (<p className="text">Analyzing sections...</p>)}

      {hasAllDescriptions &&
        sections.map((section) => {
          const desc = sectionDescriptions.find((d) => d.section === section.name)
          if (!desc) return null

          return (
            <div key={section.name}>
              <SectionDescriptions
                sections={[section]}
                descriptions={[desc]}
              />
            </div>
          )
        })}
    </div>
  )
}
