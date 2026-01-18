import { useRef } from 'react'
import { VideoPlayer } from './VideoPlayer'

interface VideoSectionProps {
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  disabled: boolean
}

export function VideoSection({ selectedFile, onFileChange, disabled }: VideoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    onFileChange(file)
  }

  // Before upload: show upload button
  if (!selectedFile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          padding: '40px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        <button
          onClick={handleButtonClick}
          disabled={disabled}
          style={{
            padding: '20px 40px',
            fontSize: '18px',
            fontWeight: 600,
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.7 : 1,
            fontFamily: '"Google Sans", sans-serif',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)'
          }}
        >
          Upload Video
        </button>
        <p
          style={{
            marginTop: '20px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px',
            fontFamily: '"Google Sans", sans-serif'
          }}
        >
          Select a dashcam video to analyze
        </p>
      </div>
    )
  }

  // After upload: show VideoPlayer
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <VideoPlayer file={selectedFile} />
    </div>
  )
}
