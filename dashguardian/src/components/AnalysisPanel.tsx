import type { AggregatedResults, VideoSection, SectionDescription } from '../types'
import { AnalysisResultsSummary } from './AnalysisResultsSummary'
import { VideoTimeline } from './VideoTimeline'
import { SectionDetailsTable } from './SectionDetailsTable'
import { SectionDescriptions } from './SectionDescriptions'
import { IndividualResultsTable } from './IndividualResultsTable'

interface AnalysisPanelProps {
  selectedFile: File | null
  results: AggregatedResults | null
  sections: VideoSection[] | null
  sectionDescriptions: SectionDescription[]
  videoDuration: number | null
  isLoading: boolean
  isDescribing: boolean
  onAnalyze: () => void
  onDescribeSections: () => void
}

export function AnalysisPanel({
  selectedFile,
  results,
  sections,
  sectionDescriptions,
  videoDuration,
  isLoading,
  isDescribing,
  onAnalyze,
  onDescribeSections
}: AnalysisPanelProps) {
  // Empty state: no file selected
  if (!selectedFile) {
    return (
      <div style={{ padding: '30px' }}>
        <div className="title">Dashcam Analyzer</div>
        <div className="text" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Upload a dashcam video to begin analysis
        </div>
      </div>
    )
  }

  // File selected but no results yet
  if (!results) {
    return (
      <div style={{ padding: '30px' }}>
        <div className="title">Dashcam Analyzer</div>
        <div className="text">
          Video loaded and ready for analysis. Click the button below to detect collision events.
        </div>
        <div style={{ margin: '30px' }}>
          <button
            onClick={onAnalyze}
            disabled={isLoading}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 600,
              backgroundColor: isLoading ? '#555' : '#7c4dff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: '"Google Sans", sans-serif',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)'
            }}
          >
            {isLoading ? '⏳ Analyzing video...' : 'Analyze Video'}
          </button>
        </div>
      </div>
    )
  }

  // Results available
  return (
    <div
      style={{
        padding: '30px',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <div className="title" style={{ margin: 0, marginBottom: '20px' }}>
        Analysis Results
      </div>

      <AnalysisResultsSummary results={results} videoDuration={videoDuration} />

      {/* Video Sections Display */}
      {sections && (
        <div style={{ marginBottom: '15px' }}>
          <h4
            style={{
              marginBottom: '10px',
              color: 'inherit',
              fontFamily: '"Google Sans", sans-serif',
              fontWeight: 500
            }}
          >
            Video Sections
          </h4>

          <VideoTimeline sections={sections} videoDuration={videoDuration} />

          <SectionDetailsTable sections={sections} />

          {/* Describe Sections Button */}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={onDescribeSections}
              disabled={isDescribing}
              style={{
                padding: '10px 20px',
                backgroundColor: '#7c4dff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: isDescribing ? 'not-allowed' : 'pointer',
                opacity: isDescribing ? 0.7 : 1,
                fontWeight: 'bold',
                fontFamily: '"Google Sans", sans-serif'
              }}
            >
              {isDescribing ? '⏳ Describing Sections...' : '🔍 Describe All Sections'}
            </button>
          </div>

          {/* Section Descriptions */}
          {sectionDescriptions.length > 0 && (
            <SectionDescriptions sections={sections} descriptions={sectionDescriptions} />
          )}
        </div>
      )}

      <IndividualResultsTable results={results.individualResults} />
    </div>
  )
}
