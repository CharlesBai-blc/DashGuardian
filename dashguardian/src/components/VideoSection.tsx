import { useRef } from 'react'
import { VideoPlayer } from './VideoPlayer'

interface VideoSectionProps {
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  disabled: boolean
}

export function VideoSection({ selectedFile, onFileChange }: VideoSectionProps) {
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
      <div id="video">
        <input ref={fileInputRef} type="file" accept="video/*" 
          onChange={handleFileSelect} style={{ display: 'none' }}/>

        <a onClick={handleButtonClick} className="upload">
          <img id="uploadIcon" src="upload.png" alt="Upload File"/>
          <div className="paragraph">
            Upload a Video File<br/> (limit 5MB)
          </div>
        </a>
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
