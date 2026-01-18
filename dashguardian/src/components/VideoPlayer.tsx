import { useState, useEffect, useRef } from 'react'

interface VideoPlayerProps {
  file: File | null
}

export function VideoPlayer({ file }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setVideoUrl(null)
    }
  }, [file])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const checkHomePage = () => {
      if (document.body.classList.contains('home-page-active')) {
        video.pause()
      }
    }

    const observer = new MutationObserver(checkHomePage)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })

    checkHomePage()

    return () => {
      observer.disconnect()
    }
  }, [videoUrl])

  if (!file || !videoUrl) {
    return null
  }

  return (
    <div>
      <video
        ref={videoRef}
        id="video"
        src={videoUrl}
        autoPlay
        loop={true}
        playsInline
        controls
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          width: '100%',
          maxHeight: 'calc(100% - 60px)',
          zIndex: 0
        }}
      >
        Your browser does not support the video tag.
      </video>
      <div id="controls">
        
      </div>
    </div>
    
  )
}
