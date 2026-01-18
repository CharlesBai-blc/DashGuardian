import { useState, useEffect, useRef, useCallback } from 'react'
import type { AggregatedResults, SectionDescription } from './types'
import { convertFileToBase64, calculateMedian } from './utils'
import { makeAnalysisCall, describeSectionCall, generateVideoSummary } from './services/apiService'
import { useVideoDuration, useVideoSections } from './hooks'
import { VideoSection, AnalysisPanel, SectionAnalyzer, CollisionTimeline } from './components'

export function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<AggregatedResults | null>(null)
  const [sectionDescriptions, setSectionDescriptions] = useState<SectionDescription[]>([])
  const [isDescribing, setIsDescribing] = useState(false)
  const [base64VideoCache, setBase64VideoCache] = useState<string | null>(null)
  const hasAutoTriggered = useRef(false)

  // Custom hooks
  const { videoDuration, hiddenVideoRef } = useVideoDuration(selectedFile)
  const sections = useVideoSections(results, videoDuration)

  // Check if all analysis is complete
  const isAnalysisComplete =
    results !== null &&
    results.summary &&
    results.summary.length > 0 &&
    !isLoading &&
    !isDescribing &&
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

  // Control scrolling based on analysis completion
  useEffect(() => {
    const mainElement = document.getElementById('main')
    if (mainElement) {
      if (isAnalysisComplete) {
        mainElement.style.overflowY = 'auto'
      } else {
        mainElement.style.overflowY = 'hidden'
      }
    }
  }, [isAnalysisComplete])

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file)
    setResults(null)
    setSectionDescriptions([])
    setBase64VideoCache(null)
    hasAutoTriggered.current = false
  }

  const handleDescribeSections = useCallback(async () => {
    if (!sections || !selectedFile || !results) return

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('API key not configured')
      return
    }

    setIsDescribing(true)

    // Initialize descriptions with loading state
    setSectionDescriptions(
      sections.map((s) => ({
        section: s.name,
        description: '',
        isLoading: true
      }))
    )

    try {
      // Use cached base64 or convert
      let base64Video = base64VideoCache
      if (!base64Video) {
        base64Video = await convertFileToBase64(selectedFile)
        setBase64VideoCache(base64Video)
      }

      // Make parallel calls for all sections
      console.log('Describing all 3 sections in parallel...')
      const promises = sections.map((section) =>
        describeSectionCall(base64Video!, apiKey, section, results.detectedFault)
          .then((structuredDescription) => ({ 
            section: section.name, 
            description: structuredDescription, 
            isLoading: false 
          }))
          .catch((error) => ({
            section: section.name,
            description: {},
            isLoading: false,
            error: error.message
          }))
      )

      const descriptionResults = await Promise.all(promises)
      setSectionDescriptions(descriptionResults as SectionDescription[])
    } catch (error) {
      console.error('Error describing sections:', error)
    } finally {
      setIsDescribing(false)
    }
  }, [sections, selectedFile, results, base64VideoCache])

  // Automatically trigger section descriptions when results and sections are available
  useEffect(() => {
    if (results && sections && selectedFile && !isDescribing && sectionDescriptions.length === 0 && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true
      handleDescribeSections()
    }
  }, [results, sections, selectedFile, isDescribing, sectionDescriptions.length, handleDescribeSections])

  const handleAnalyze = async () => {
    if (!selectedFile) {
      console.error('Please select a video file first')
      return
    }

    try {
      setIsLoading(true)
      setResults(null)
      setSectionDescriptions([])
      hasAutoTriggered.current = false
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error(
          'OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.'
        )
      }

      // Convert file to base64 and cache it
      const base64Video = await convertFileToBase64(selectedFile)
      setBase64VideoCache(base64Video)

      // Make 5 parallel API calls and summary call
      console.log('Making 5 parallel API calls and summary call...')
      const analysisPromises = Array.from({ length: 5 }, () => makeAnalysisCall(base64Video, apiKey))
      const summaryPromise = generateVideoSummary(base64Video, apiKey)
      
      // Wait for all calls to complete
      const [apiResults, videoSummary] = await Promise.all([
        Promise.all(analysisPromises),
        summaryPromise.catch((error) => {
          console.error('Error generating video summary:', error)
          return 'Summary generation failed'
        })
      ])

      // Filter out null values with type guard
      const validResults = apiResults.filter(
        (r): r is NonNullable<typeof r> => r !== null
      )

      console.log('Individual results:', validResults)

      if (validResults.length > 0) {
        // Calculate median of approx_t_s
        const times = validResults.map((r) => r.approx_t_s)
        const medianTime = calculateMedian(times)

        // Calculate median window (median of starts and ends)
        const windowStarts = validResults.map((r) => r.window_s[0])
        const windowEnds = validResults.map((r) => r.window_s[1])
        const medianWindow: [number, number] = [
          calculateMedian(windowStarts),
          calculateMedian(windowEnds)
        ]

        console.log('Median collision time:', medianTime, 'seconds')
        console.log('Median window:', medianWindow)

        // Determine majority fault with improved accuracy
        // Require at least 3 out of 5 votes (60% consensus) for higher confidence
        const faultCounts = validResults.reduce(
          (acc, curr) => {
            acc[curr.fault] = (acc[curr.fault] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        const faultEntries = Object.entries(faultCounts)
        const maxFault = faultEntries.reduce((a, b) => a[1] > b[1] ? a : b)
        const minConsensus = Math.ceil(validResults.length * 0.6) // At least 60% consensus (3 out of 5)
        
        // If we have strong consensus (at least 60%), use it
        // Otherwise, use simple majority
        let detectedFault: 'victim' | 'offender' | 'witness'
        if (maxFault[1] >= minConsensus) {
          detectedFault = maxFault[0] as 'victim' | 'offender' | 'witness'
          console.log(`Strong consensus (${maxFault[1]}/${validResults.length}) for:`, detectedFault)
        } else {
          // Fallback to simple majority
          detectedFault = maxFault[0] as 'victim' | 'offender' | 'witness'
          console.log(`Majority vote (${maxFault[1]}/${validResults.length}) for:`, detectedFault)
        }
        
        console.log('Fault distribution:', faultCounts)

        // Set results with summary (both ready at the same time)
        setResults({
          individualResults: validResults,
          medianTime,
          medianWindow,
          detectedFault,
          summary: videoSummary
        })
      } else {
        console.error('No valid results received from API calls')
      }
    } catch (error) {
      console.error('Error analyzing video:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Top Section: Left + Right Panels */}
      <div className="analyzer-top-section">
        {/* Left Panel - Video Section */}
        <div id="left">
          <VideoSection
            selectedFile={selectedFile}
            onFileChange={handleFileChange}
            disabled={isLoading}
          />
          <div id="controls">
            {results && videoDuration > 0 && (
              <CollisionTimeline
                collisionTime={results.medianTime}
                videoDuration={videoDuration}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Analysis Panel */}
        <div id="right">
          <AnalysisPanel
            selectedFile={selectedFile}
            results={results}
            sections={sections}
            videoDuration={videoDuration}
            isLoading={isLoading}
            isDescribing={isDescribing}
            onAnalyze={handleAnalyze}
          />
        </div>
      </div>

      {/* Bottom Section: Full-width Section Analyzer */}
      <SectionAnalyzer
        sections={sections}
        sectionDescriptions={sectionDescriptions}
        isDescribing={isDescribing}
        detectedFault={results?.detectedFault}
      />

      {/* Hidden video element to get duration */}
      <video ref={hiddenVideoRef} style={{ display: 'none' }} />
    </>
  )
}
