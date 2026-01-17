import { useState } from 'react'

export interface VideoChunk {
  index: number;
  startTime: number;
  duration: number;
  base64: string;
}

export function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSplitting, setIsSplitting] = useState(false)
  const [chunks, setChunks] = useState<VideoChunk[]>([])
  const [chunkDuration, setChunkDuration] = useState(3)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setChunks([]);
    }
  };

  const handleSplitVideo = async () => {
    if (!selectedFile) {
      console.error("Please select a video file first");
      return;
    }

    try {
      // First check if server is running
      try {
        const healthCheck = await fetch('/api/health');
        if (!healthCheck.ok) {
          throw new Error('Server is not responding. Make sure the server is running on port 3001.');
        }
      } catch {
        throw new Error('Cannot connect to server. Please make sure the server is running: cd server && npm start');
      }

      setIsSplitting(true);
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('chunkDuration', chunkDuration.toString());

      const response = await fetch('/api/split-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Video split into ${data.totalChunks} chunks`);
      setChunks(data.chunks);
    } catch (error) {
      console.error("Error splitting video:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSplitting(false);
    }
  };

  const analyzeChunk = async (chunk: VideoChunk) => {
    try {
      setIsLoading(true);
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.");
      }

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
                  "text": `Analyze this dashcam. Identify hazards. There is a collision. note the exact details of the collision. This is chunk ${chunk.index} (${chunk.startTime}s - ${chunk.startTime + chunk.duration}s).`
                },
                {
                  "type": "video_url",
                  "video_url": {
                    "url": chunk.base64
                  }
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      console.log(`Chunk ${chunk.index} API Response:`, data);
      console.log(`Chunk ${chunk.index} Message Content:`, data.choices?.[0]?.message?.content);
    } catch (error) {
      console.error(`Error analyzing chunk ${chunk.index}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeAll = async () => {
    if (chunks.length === 0) {
      console.error("Please split the video first");
      return;
    }

    // Analyze chunks sequentially to avoid overwhelming the API
    for (const chunk of chunks) {
      await analyzeChunk(chunk);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={isLoading || isSplitting}
          style={{ marginBottom: '10px', display: 'block' }}
        />
        <div style={{ marginBottom: '10px' }}>
          <label>
            Chunk Duration (seconds):{' '}
            <input
              type="number"
              min="1"
              max="10"
              value={chunkDuration}
              onChange={(e) => setChunkDuration(parseInt(e.target.value) || 3)}
              disabled={isLoading || isSplitting}
              style={{ width: '60px', marginLeft: '5px' }}
            />
          </label>
        </div>
        {selectedFile && (
          <p style={{ color: 'blue', marginBottom: '10px' }}>
            ✓ {selectedFile.name} selected
          </p>
        )}
        {isSplitting && <p>⏳ Splitting video into chunks...</p>}
        {chunks.length > 0 && (
          <p style={{ color: 'green', marginBottom: '10px' }}>
            ✓ Video split into {chunks.length} chunks
          </p>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <button 
          onClick={handleSplitVideo} 
          disabled={!selectedFile || isSplitting || isLoading}
        >
          Split Video
        </button>
        <button 
          onClick={handleAnalyzeAll} 
          disabled={chunks.length === 0 || isLoading || isSplitting}
        >
          Analyze All Chunks
        </button>
      </div>

      {chunks.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Chunks ({chunks.length}):</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
            {chunks.map((chunk) => (
              <div key={chunk.index} style={{ marginBottom: '5px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <span>Chunk {chunk.index}: {chunk.startTime}s - {chunk.startTime + chunk.duration}s</span>
                <button
                  onClick={() => analyzeChunk(chunk)}
                  disabled={isLoading || isSplitting}
                  style={{ marginLeft: '10px', padding: '2px 8px' }}
                >
                  Analyze
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
