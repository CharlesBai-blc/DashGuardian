import { useState } from 'react'
import type { AggregatedResults, SectionDescription } from './types'
import { convertFileToBase64, calculateMedian } from './utils'
import { makeAnalysisCall, describeSectionCall } from './services/apiService'
import { useVideoDuration, useVideoSections } from './hooks'
import { VideoSection, AnalysisPanel } from './components'

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
    <>
      {/* Left Panel - Video Section */}
      <div id="left">
        <VideoSection
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          disabled={isLoading}
        />
        <div id="controls">
          <div id="scroll"></div>
        </div>
      </div>

      {/* Right Panel - Analysis Panel */}
      <div id="right">
        <AnalysisPanel
          selectedFile={selectedFile}
          results={results}
          sections={sections}
          sectionDescriptions={sectionDescriptions}
          videoDuration={videoDuration}
          isLoading={isLoading}
          isDescribing={isDescribing}
          onAnalyze={handleAnalyze}
          onDescribeSections={handleDescribeSections}
        />
      </div>

      {/* Hidden video element to get duration */}
      <video ref={hiddenVideoRef} style={{ display: 'none' }} />
    </>
  )
}
