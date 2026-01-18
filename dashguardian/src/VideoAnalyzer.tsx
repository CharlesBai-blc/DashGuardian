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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { videoDuration, hiddenVideoRef } = useVideoDuration(selectedFile)
  const sections = useVideoSections(results, videoDuration)

  const isAnalysisComplete: boolean =
    results !== null &&
    results.summary !== null &&
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

  const handleResetAndUpload = () => {
    // Reset all state
    setSelectedFile(null)
    setResults(null)
    setSectionDescriptions([])
    setBase64VideoCache(null)
    setIsLoading(false)
    setIsDescribing(false)
    hasAutoTriggered.current = false
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Trigger file picker
    fileInputRef.current?.click()
  }

  const handleNewFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDescribeSections = useCallback(async () => {
    if (!sections || !selectedFile || !results) return

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      console.error('API key not configured')
      return
    }

    setIsDescribing(true)

    setSectionDescriptions(
      sections.map((s) => ({
        section: s.name,
        description: '',
        isLoading: true
      }))
    )

    try {
      let base64Video = base64VideoCache
      if (!base64Video) {
        base64Video = await convertFileToBase64(selectedFile)
        setBase64VideoCache(base64Video)
      }

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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error(
          'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.'
        )
      }

      const base64Video = await convertFileToBase64(selectedFile)
      setBase64VideoCache(base64Video)

      const analysisPromises = Array.from({ length: 8 }, () => makeAnalysisCall(base64Video, apiKey))
      const summaryPromise = generateVideoSummary(base64Video, apiKey)
      
      const [apiResults, videoSummary] = await Promise.all([
        Promise.all(analysisPromises),
        summaryPromise.catch((error) => {
          console.error('Error generating video summary:', error)
          return 'Summary generation failed'
        })
      ])

      const validResults = apiResults.filter(
        (r): r is NonNullable<typeof r> => r !== null
      )

      if (validResults.length > 0) {
        const times = validResults.map((r) => r.approx_t_s)
        const medianTime = calculateMedian(times)

        const windowStarts = validResults.map((r) => r.window_s[0])
        const windowEnds = validResults.map((r) => r.window_s[1])
        const medianWindow: [number, number] = [
          calculateMedian(windowStarts),
          calculateMedian(windowEnds)
        ]

        const faultCounts = validResults.reduce(
          (acc, curr) => {
            acc[curr.fault] = (acc[curr.fault] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        const faultEntries = Object.entries(faultCounts)
        const maxFault = faultEntries.reduce((a, b) => a[1] > b[1] ? a : b)
        const detectedFault = maxFault[0] as 'victim' | 'offender' | 'witness'

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
      <div className="snap-page">
        <div className="analyzer-top-section">
          <div id="left">
            <VideoSection
              selectedFile={selectedFile}
              onFileChange={handleFileChange}
              disabled={isLoading}
            />
            {results && videoDuration != null && videoDuration > 0 && typeof results.medianTime === 'number' && (
              <div className="timeline-container">
                <CollisionTimeline
                  collisionTime={results.medianTime}
                  videoDuration={videoDuration}
                />
              </div>
            )}
          </div>

          <div id="right">
            <AnalysisPanel
              selectedFile={selectedFile}
              results={results}
              sections={sections}
              videoDuration={videoDuration}
              isLoading={isLoading}
              isDescribing={isDescribing}
              onAnalyze={handleAnalyze}
              onResetAndUpload={handleResetAndUpload}
              isAnalysisComplete={isAnalysisComplete}
            />
          </div>
        </div>
      </div>

      <SectionAnalyzer
        sections={sections}
        sectionDescriptions={sectionDescriptions}
      />

      {sectionDescriptions.length === 3 && (
        <div className="snap-page snap-page-footer">
          <footer className="page-footer">
            &copy; 2026 DashGuardian, All Rights Reserved
          </footer>
        </div>
      )}

      <video ref={hiddenVideoRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleNewFileSelect}
        style={{ display: 'none' }}
      />
    </>
  )
}
