import { useState, useEffect } from 'react'

interface VideoPlayerProps {
  file: File | null
}

export function VideoPlayer({ file }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)

      // Cleanup: revoke the object URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setVideoUrl(null)
    }
  }, [file])

  if (!file || !videoUrl) {
    return null
  }

  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      <video
        src={videoUrl}
        controls
        style={{
          width: '100%',
          maxWidth: '800px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
