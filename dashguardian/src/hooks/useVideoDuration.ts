import { useState, useRef, useEffect } from 'react'

export const useVideoDuration = (file: File | null) => {
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const hiddenVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (file && hiddenVideoRef.current) {
      const video = hiddenVideoRef.current
      const url = URL.createObjectURL(file)
      video.src = url

      video.onloadedmetadata = () => {
        setVideoDuration(video.duration)
        URL.revokeObjectURL(url)
      }
    } else {
      setVideoDuration(null)
    }
  }, [file])

  return { videoDuration, hiddenVideoRef }
}
