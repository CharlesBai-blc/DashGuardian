import { useState, useEffect } from 'react'
import type { VideoSection, AggregatedResults } from '../types'

export const useVideoSections = (
  results: AggregatedResults | null,
  videoDuration: number | null
) => {
  const [sections, setSections] = useState<VideoSection[] | null>(null)

  useEffect(() => {
    if (results && videoDuration) {
      const medianTime = results.medianTime

      const eventStart = Math.max(0, medianTime - 5)
      const eventEnd = Math.min(videoDuration, medianTime + 5)

      const newSections: VideoSection[] = [
        {
          name: 'ante',
          label: 'Ante',
          start: 0,
          end: eventStart,
          duration: eventStart
        },
        {
          name: 'event',
          label: 'Event',
          start: eventStart,
          end: eventEnd,
          duration: eventEnd - eventStart
        },
        {
          name: 'post',
          label: 'Post',
          start: eventEnd,
          end: videoDuration,
          duration: videoDuration - eventEnd
        }
      ]

      setSections(newSections)
    } else {
      setSections(null)
    }
  }, [results, videoDuration])

  return sections
}
