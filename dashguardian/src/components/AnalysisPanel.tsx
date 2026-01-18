import { useEffect, useState, useRef } from 'react'
import type { AggregatedResults, VideoSection } from '../types'
import { AnalysisResultsSummary } from './AnalysisResultsSummary'

interface AnalysisPanelProps {
  selectedFile: File | null
  results: AggregatedResults | null
  sections: VideoSection[] | null
  videoDuration: number | null
  isLoading: boolean
  isDescribing?: boolean
  onAnalyze: () => void
}

export function AnalysisPanel({
  selectedFile,
  results,
  videoDuration,
  isLoading,
  isDescribing = false,
  onAnalyze
}: AnalysisPanelProps) {
  const [progress, setProgress] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const prevLoadingRef = useRef(isLoading)

  // Section analysis progress bar state
  const [sectionProgress, setSectionProgress] = useState(0)
  const [isSectionCompleting, setIsSectionCompleting] = useState(false)
  const prevDescribingRef = useRef(isDescribing)

  // Animate progress bar when loading
  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    prevLoadingRef.current = isLoading

    if (isLoading && !wasLoading) {
      // Just started loading - reset in next tick
      setTimeout(() => {
        setProgress(0)
        setIsCompleting(false)
      }, 0)
    }

    if (isLoading) {
      // Animate progress (doesn't need to be accurate, just visual feedback)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return 95 // Stop at 95% until actually complete
          }
          // Accelerate progress (starts fast, slows down)
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1
          return prev + increment
        })
      }, 200)

      return () => clearInterval(interval)
    } else if (wasLoading && !isLoading) {
      // Just finished loading - complete the progress bar in next tick
      setTimeout(() => {
        setIsCompleting(true)
        setProgress(100)
      }, 0)
    }
  }, [isLoading])

  // Fade out after completion
  useEffect(() => {
    if (isCompleting && progress === 100) {
      const fadeTimeout = setTimeout(() => {
        setProgress(0)
        setIsCompleting(false)
      }, 500)
      return () => clearTimeout(fadeTimeout)
    }
  }, [isCompleting, progress])

  const showProgress = isLoading || isCompleting

  // Animate section analysis progress bar
  useEffect(() => {
    const wasDescribing = prevDescribingRef.current
    prevDescribingRef.current = isDescribing

    if (isDescribing && !wasDescribing) {
      // Just started describing - reset in next tick
      setTimeout(() => {
        setSectionProgress(0)
        setIsSectionCompleting(false)
      }, 0)
    }

    if (isDescribing) {
      // Animate progress (doesn't need to be accurate, just visual feedback)
      const interval = setInterval(() => {
        setSectionProgress((prev) => {
          if (prev >= 95) {
            return 95 // Stop at 95% until actually complete
          }
          // Accelerate progress (starts fast, slows down)
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1
          return prev + increment
        })
      }, 200)

      return () => clearInterval(interval)
    } else if (wasDescribing && !isDescribing) {
      // Just finished describing - complete the progress bar in next tick
      setTimeout(() => {
        setIsSectionCompleting(true)
        setSectionProgress(100)
      }, 0)
    }
  }, [isDescribing])

  // Fade out section progress bar after completion
  useEffect(() => {
    if (isSectionCompleting && sectionProgress === 100) {
      const fadeTimeout = setTimeout(() => {
        setSectionProgress(0)
        setIsSectionCompleting(false)
      }, 500)
      return () => clearTimeout(fadeTimeout)
    }
  }, [isSectionCompleting, sectionProgress])

  const showSectionProgress = isDescribing || isSectionCompleting

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
              backgroundColor: isLoading ? '#555' : '#fff',
              color: '#000',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: '"Google Sans", sans-serif',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
            }}
          >
            {isLoading ? 'Analyzing video...' : 'Analyze Video'}
          </button>
          
          {showProgress && (
            <div
              style={{
                marginTop: '15px',
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                opacity: progress >= 100 ? 0 : 1,
                transition: progress >= 100 ? 'opacity 0.5s ease-out' : 'none'
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#fff',
                  borderRadius: '2px',
                  transition: 'width 0.2s ease-out'
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Results available - single page summary
  return (
    <div
      className="analysis-panel-scrollable"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '30px'
      }}
    >
      <div className="title" style={{ margin: 0, marginBottom: '20px' }}>
        Analysis Results
      </div>

      <AnalysisResultsSummary results={results} videoDuration={videoDuration} />

      {/* Summary Text - Only show when both timing info and summary are ready */}
      {results.summary && (
        <div
          style={{
            marginTop: '5px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'transparent',
            borderRadius: '12px',
            borderLeft: '4px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: '15px',
              color: '#fff',
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '24px',
              fontWeight: 600
            }}
          >
            Incident Summary
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '16px',
              lineHeight: '1.8',
              listStyleType: 'disc'
            }}
          >
            {results.summary
              .split(/[.!?]+/)
              .map((sentence) => sentence.trim())
              .filter((sentence) => sentence.length > 0)
              .map((sentence, index) => (
                <li
                  key={index}
                  style={{
                    marginBottom: '8px'
                  }}
                >
                  {sentence}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Section Analysis Progress Bar */}
      {showSectionProgress && (
        <div
          style={{
            marginTop: '10px',
            marginBottom: '20px'
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              fontFamily: '"Google Sans", sans-serif'
            }}
          >
            (section analysis in progress)
          </p>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              opacity: sectionProgress >= 100 ? 0 : 1,
              transition: sectionProgress >= 100 ? 'opacity 0.5s ease-out' : 'none'
            }}
          >
            <div
              style={{
                width: `${sectionProgress}%`,
                height: '100%',
                backgroundColor: '#fff',
                borderRadius: '2px',
                transition: 'width 0.2s ease-out'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
