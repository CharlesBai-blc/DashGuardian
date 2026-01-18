import { useEffect, useState, useRef } from 'react'
import type { AggregatedResults, VideoSection } from '../types'
import { AnalysisResultsSummary } from './AnalysisResultsSummary'
import './components.css'

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
      <div className="component-padding">
        <div className="title">Dashcam Analyzer</div>
        <div className="text component-text-light">
          Upload a dashcam video to begin analysis
        </div>
      </div>
    )
  }

  // File selected but no results yet
  if (!results) {
    return (
      <div className="component-padding">
        <div className="title">Dashcam Analyzer</div>
        <div className="text">
          Video loaded and ready for analysis. Click the button below to detect collision events.
        </div>
        <div className="component-margin-top-lg">
          <button
            onClick={onAnalyze}
            disabled={isLoading}
            className="component-button"
          >
            {isLoading ? 'Analyzing video...' : 'Analyze Video'}
          </button>
          
          {showProgress && (
            <div
              className="progress-bar-container component-margin-top"
              style={{
                opacity: progress >= 100 ? 0 : 1,
                transition: progress >= 100 ? 'opacity 0.5s ease-out' : 'none'
              }}
            >
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Results available - single page summary
  return (
    <div className="analysis-panel-scrollable component-scrollable">
      <div className="title title-override">Analysis Results</div>

      <AnalysisResultsSummary results={results} videoDuration={videoDuration} />

      {/* Summary Text - Only show when both timing info and summary are ready */}
      {results.summary && (
        <div className="component-card component-margin-top-xs" style={{ marginBottom: '30px' }}>
          <h3 className="component-heading-3">Incident Summary</h3>
          <ul className="component-list">
            {results.summary
              .split(/[.!?]+/)
              .map((sentence) => sentence.trim())
              .filter((sentence) => sentence.length > 0)
              .map((sentence, index) => (
                <li key={index} className="component-list-item">
                  {sentence}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Section Analysis Progress Bar */}
      {showSectionProgress && (
        <div className="component-margin-top-sm" style={{ marginBottom: '20px' }}>
          <p className="component-progress-label">(section analysis in progress)</p>
          <div
            className="progress-bar-container"
            style={{
              opacity: sectionProgress >= 100 ? 0 : 1,
              transition: sectionProgress >= 100 ? 'opacity 0.5s ease-out' : 'none'
            }}
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${sectionProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
