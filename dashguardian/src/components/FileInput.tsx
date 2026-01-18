interface FileInputProps {
  onFileChange: (file: File | null) => void
  selectedFile: File | null
  disabled: boolean
}

export function FileInput({ onFileChange, selectedFile, disabled }: FileInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    onFileChange(file)
  }

  return (
    <>
      <input
        type="file"
        accept="video/*"
        onChange={handleChange}
        disabled={disabled}
        style={{ marginBottom: '10px', display: 'block' }}
      />
      {selectedFile && (
        <p style={{ color: '#64b5f6', marginBottom: '10px' }}>
          ✓ {selectedFile.name} selected
        </p>
      )}
    </>
  )
}
