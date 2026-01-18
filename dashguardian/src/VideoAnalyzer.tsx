import { useState } from 'react'
import { VideoPlayer } from './components/VideoPlayer'
import type { AggregatedResults, SectionDescription } from './types'
import { convertFileToBase64, calculateMedian } from './utils'
import { makeAnalysisCall, describeSectionCall } from './services/apiService'
import { useVideoDuration, useVideoSections } from './hooks'
import {
  FileInput,
  AnalysisResultsSummary,
  VideoTimeline,
  SectionDetailsTable,
  SectionDescriptions,
  IndividualResultsTable
} from './components'

export function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<AggregatedResults | null>(null)
  const [sectionDescriptions, setSectionDescriptions] = useState<SectionDescription[]>([])
  const [isDescribing, setIsDescribing] = useState(false)
  const [base64VideoCache, setBase64VideoCache] = useState<string | null>(null)

  // Custom hooks
  const { videoDuration, hiddenVideoRef } = useVideoDuration(selectedFile)
  const sections = useVideoSections(results, videoDuration)

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file)
    setResults(null)
    setSectionDescriptions([])
    setBase64VideoCache(null)
  }

  const handleDescribeSections = async () => {
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
          .then((description) => ({ section: section.name, description, isLoading: false }))
          .catch((error) => ({
            section: section.name,
            description: '',
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
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      console.error('Please select a video file first')
      return
    }

    try {
      setIsLoading(true)
      setResults(null)
      setSectionDescriptions([])
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error(
          'OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.'
        )
      }

      // Convert file to base64 and cache it
      const base64Video = await convertFileToBase64(selectedFile)
      setBase64VideoCache(base64Video)

      // Make 5 parallel API calls
      console.log('Making 5 parallel API calls...')
      const promises = Array.from({ length: 5 }, () => makeAnalysisCall(base64Video, apiKey))
      const apiResults = await Promise.all(promises)

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

        // Determine majority fault
        const faultCounts = validResults.reduce(
          (acc, curr) => {
            acc[curr.fault] = (acc[curr.fault] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        const detectedFault = Object.entries(faultCounts).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0] as 'victim' | 'offender' | 'witness'
        console.log('Detected fault/perspective:', detectedFault)

        setResults({
          individualResults: validResults,
          medianTime,
          medianWindow,
          detectedFault
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
    <div className="card">
      <div style={{ marginBottom: '20px' }}>
        <FileInput
          onFileChange={handleFileChange}
          selectedFile={selectedFile}
          disabled={isLoading}
        />

        {isLoading && <p>⏳ Analyzing video (5 parallel calls)...</p>}

        {results && (
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h3 style={{ marginTop: 0, color: 'inherit' }}>Analysis Results</h3>

            <AnalysisResultsSummary results={results} videoDuration={videoDuration} />

            {/* Video Sections Display */}
            {sections && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px', color: 'inherit' }}>Video Sections</h4>

                <VideoTimeline sections={sections} videoDuration={videoDuration} />

                <SectionDetailsTable sections={sections} />

                {/* Describe Sections Button */}
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={handleDescribeSections}
                    disabled={isDescribing}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#7c4dff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isDescribing ? 'not-allowed' : 'pointer',
                      opacity: isDescribing ? 0.7 : 1,
                      fontWeight: 'bold'
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
        )}
      </div>

      <VideoPlayer file={selectedFile} />

      <button onClick={handleAnalyze} disabled={!selectedFile || isLoading}>
        Analyze Video
      </button>

      {/* Hidden video element to get duration */}
      <video ref={hiddenVideoRef} style={{ display: 'none' }} />
    </div>
  )
}
