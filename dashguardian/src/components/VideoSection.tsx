import { useRef, useState } from 'react'
import { VideoPlayer } from './VideoPlayer'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

interface VideoSectionProps {
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  disabled: boolean
}

export function VideoSection({ selectedFile, onFileChange }: VideoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileSizeError, setFileSizeError] = useState<string | null>(null)

  const handleButtonClick = () => {
    setFileSizeError(null)
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    
    if (file && file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setFileSizeError(`File is too large (${sizeMB}MB). Please select a file under 5MB.`)
      // Clear the input so user can select again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    setFileSizeError(null)
    onFileChange(file)
  }

  if (!selectedFile) {
    return (
      <div id="video">
        <input ref={fileInputRef} type="file" accept="video/*" 
          onChange={handleFileSelect} style={{ display: 'none' }}/>

        <a onClick={handleButtonClick} className="upload">
          <img id="uploadIcon" src="upload.png" alt="Upload File"/>
          <div className="paragraph">
            Upload a Video File<br/> (formats: .mp4, .mov, limit 5MB)<br/> 
          </div>
        </a>
        {fileSizeError && (
          <div style={{
            color: '#ef5350',
            fontSize: '14px',
            fontFamily: '"Google Sans", sans-serif',
            marginTop: '15px',
            textAlign: 'center',
            padding: '10px 20px',
            backgroundColor: 'rgba(239, 83, 80, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 83, 80, 0.3)'
          }}>
            {fileSizeError}
          </div>
        )}
      </div>
    )
  }

  return (
    <div id="video-container">
      <VideoPlayer file={selectedFile} />
    </div>
  )
}
