import { useEffect, useState, useRef } from 'react'
import type { AggregatedResults, VideoSection } from '../types'
import { AnalysisResultsSummary } from './AnalysisResultsSummary'
import '../App.css'

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
  isLoading,
  isDescribing = false,
  onAnalyze
}: AnalysisPanelProps) {
  const [progress, setProgress] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const prevLoadingRef = useRef(isLoading)

  const [sectionProgress, setSectionProgress] = useState(0)
  const [isSectionCompleting, setIsSectionCompleting] = useState(false)
  const prevDescribingRef = useRef(isDescribing)

  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    prevLoadingRef.current = isLoading

    if (isLoading && !wasLoading) {
      setTimeout(() => {
        setProgress(0)
        setIsCompleting(false)
      }, 0)
    }

    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return 95
          }
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1
          return prev + increment
        })
      }, 200)

      return () => clearInterval(interval)
    } else if (wasLoading && !isLoading) {
      setTimeout(() => {
        setIsCompleting(true)
        setProgress(100)
      }, 0)
    }
  }, [isLoading])

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

  useEffect(() => {
    const wasDescribing = prevDescribingRef.current
    prevDescribingRef.current = isDescribing

    if (isDescribing && !wasDescribing) {
      setTimeout(() => {
        setSectionProgress(0)
        setIsSectionCompleting(false)
      }, 0)
    }

    if (isDescribing) {
      const interval = setInterval(() => {
        setSectionProgress((prev) => {
          if (prev >= 95) {
            return 95
          }
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1
          return prev + increment
        })
      }, 200)

      return () => clearInterval(interval)
    } else if (wasDescribing && !isDescribing) {
      setTimeout(() => {
        setIsSectionCompleting(true)
        setSectionProgress(100)
      }, 0)
    }
  }, [isDescribing])

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

  if (!selectedFile) {
    return (
      <div className="component-padding">
        <div className="title" style ={{marginTop: '60px'}}>Dashcam Analyzer</div>
        <div style={{ marginTop: '36px' }}>
          <div className="header" style={{ marginBottom: '32px' }}>Uncertainty into <span style={{ color: '#90cdf4' }}>Clarity</span><br></br>at the touch of a button.</div>
          <div className="text">
            <ul>
              <li style ={{marginBottom: '18px', fontSize: '18px'}}>Automatically detect <span style={{ color: '#ef5350' }}>collision events</span> in your dashcam footage</li>
              <li style ={{marginBottom: '18px', fontSize: '18px'}}>Get <span style={{ color: '#64b5f6' }}>precise</span> timing information showing exactly when incidents occurred</li>
              <li style ={{marginBottom: '18px', fontSize: '18px'}}>Identify your perspective as <span style={{ color: '#64b5f6' }}>victim</span>, <span style={{ color: '#ef5350' }}>offender</span>, or <span style={{ color: '#7c4dff' }}>witness</span></li>
              <li style ={{marginBottom: '18px', fontSize: '18px'}}>Receive detailed incident summaries and section-by-section <span style={{ color: '#7c4dff' }}>analysis</span></li>
              <li style ={{marginBottom: '18px', fontSize: '18px'}}><span style={{ color: '#64b5f6' }}>Review</span> before, during, and after segments of each collision event</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="">
        <div className="title" style ={{marginTop: '60px'}}>Dashcam Analyzer</div>
        <div className="text" style ={{marginTop: '36px', fontSize: '18px'}}>
          Video loaded successfully and ready for analysis.<br/> Click the <span style={{ color: '#90cdf4' }}>button</span> below to get started.
        </div>

        
        <a onClick={onAnalyze} className="analyzeButton">
          {isLoading ? 'Analyzing video...' : 'Analyze Video'}
        </a>
        
        
        
        {showProgress && (
          <div
            className="progressBar"
            style={{
              opacity: progress >= 100 ? 0 : 1,
              transition: progress >= 100 ? 'opacity 0.5s ease-out' : 'none'
            }}
          >
            <div
              className="progressBarFill"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height:'100vh' }}>
      <div className="title">Analysis Results</div>

      {results.summary && (
        <div className="header" style={{ marginBottom: '30px', marginTop: '30px' }}>
          <div className="" style={{ marginBottom: '30px' }}>Incident Summary:</div>
          
            {results.summary
              .split(/[.!?]+/)
              .map((sentence) => sentence.trim())
              .filter((sentence) => sentence.length > 0)
              .filter((sentence) => !/^(thought|thinking|analysis|summary|here is|here's)/i.test(sentence))
              .map((sentence, index) => (
                <li key={index} className="text" style={{ marginBottom: '36px' }}>
                  {sentence}
                </li>
              ))} 
              <AnalysisResultsSummary results={results} />
        </div>
      )}

      {showSectionProgress && (
        <div className="" style={{ marginBottom: '30px' }}>
          <p className="text">Performing in-depth analysis...</p>
          <div
            className="progressBar"
            style={{
              opacity: sectionProgress >= 100 ? 0 : 1,
              transition: sectionProgress >= 100 ? 'opacity 0.5s ease-out' : 'none'
            }}
          >
            <div
              className="progressBarFill"
              style={{ width: `${sectionProgress}%` }}
            />
          </div>
        </div>
      )}

      {results.summary && !showSectionProgress && !isDescribing && (
        <div className="text" style={{ 
          marginTop: '20px', 
          color: 'rgba(255, 255, 255, 0.6)',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          ↓ Scroll down for in-depth analysis ↓
        </div>
      )}
    </div>
  )
}
