import { useState } from 'react'
import { VideoPlayer } from './VideoPlayer'

export function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      console.error("Please select a video file first");
      return;
    }

    try {
      setIsLoading(true);
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.");
      }

      // Convert file to base64
      const base64Video = await convertFileToBase64(selectedFile);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "allenai/molmo-2-8b:free",
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": `Locate the exact temporal start of the collision. Ground the moment of first physical contact between [Object A] and [Object B]. Return the timestamp.`
                },
                {
                  "type": "video_url",
                  "video_url": {
                    "url": base64Video
                  }
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const collisionTime = data.choices?.[0]?.message?.content?.trim();
      console.log("Collision Time:", collisionTime);
    } catch (error) {
      console.error("Error analyzing video:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={isLoading}
          style={{ marginBottom: '10px', display: 'block' }}
        />
        {selectedFile && (
          <p style={{ color: 'blue', marginBottom: '10px' }}>
            ✓ {selectedFile.name} selected
          </p>
        )}
        {isLoading && <p>⏳ Analyzing video...</p>}
      </div>

      <VideoPlayer file={selectedFile} />
      
      <button 
        onClick={handleAnalyze} 
        disabled={!selectedFile || isLoading}
      >
        Analyze Video
      </button>
    </div>
  )
}
