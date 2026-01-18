import { useState, useRef, useEffect } from 'react'
import { VideoPlayer } from './VideoPlayer'

interface AnalysisResult {
  approx_t_s: number
  window_s: [number, number]
}

interface VideoSection {
  name: 'ante' | 'event' | 'post'
  label: string
  start: number
  end: number
  duration: number
}

interface AggregatedResults {
  individualResults: AnalysisResult[]
  medianTime: number
  medianWindow: [number, number]
}

export function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<AggregatedResults | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [sections, setSections] = useState<VideoSection[] | null>(null)
  const hiddenVideoRef = useRef<HTMLVideoElement>(null)

  // Get video duration when file changes
  useEffect(() => {
    if (selectedFile && hiddenVideoRef.current) {
      const video = hiddenVideoRef.current
      const url = URL.createObjectURL(selectedFile)
      video.src = url
      
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration)
        URL.revokeObjectURL(url)
      }
    } else {
      setVideoDuration(null)
      setSections(null)
    }
  }, [selectedFile])

  // Calculate sections when we have both results and video duration
  useEffect(() => {
    if (results && videoDuration) {
      const medianTime = results.medianTime
      
      // Event section: 5 seconds before to 5 seconds after median
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
    }
  }, [results, videoDuration])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
      setSections(null);
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

  const parseJsonResponse = (text: string): AnalysisResult | null => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.approx_t_s === 'number' && Array.isArray(parsed.window_s)) {
          return {
            approx_t_s: parsed.approx_t_s,
            window_s: parsed.window_s as [number, number]
          };
        }
      }
      return null;
    } catch {
      console.error("Failed to parse JSON:", text);
      return null;
    }
  };

  const calculateMedian = (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  };

  const makeAnalysisCall = async (base64Video: string, apiKey: string): Promise<AnalysisResult | null> => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "allenai/molmo-2-8b:free",
          "response_format": { "type": "json_object" },
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": `Watch the entire video. Identify the first physical contact (collision) using this definition: first frame where bodies touch. Consider sudden and heavy camera movement as a very clear indication of collision.

Return ONLY JSON with:
- approx_t_s (seconds from start, to nearest 0.1s)
- window_s as [start, end] (a 2–4 second window that definitely contains first contact)

Example response: {"approx_t_s": 5.2, "window_s": [4.0, 7.0]}`
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
      const content = data.choices?.[0]?.message?.content?.trim();
      console.log("Raw API response:", content);
      if (content) {
        return parseJsonResponse(content);
      }
      return null;
    } catch (error) {
      console.error("Error in analysis call:", error);
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      console.error("Please select a video file first");
      return;
    }

    try {
      setIsLoading(true);
      setResults(null);
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.");
      }

      // Convert file to base64
      const base64Video = await convertFileToBase64(selectedFile);

      // Make 8 parallel API calls
      console.log("Making 8 parallel API calls...");
      const promises = Array.from({ length: 8 }, () => makeAnalysisCall(base64Video, apiKey));
      const apiResults = await Promise.all(promises);

      // Filter out null values
      const validResults = apiResults.filter((r): r is AnalysisResult => r !== null);
      
      console.log("Individual results:", validResults);
      
      if (validResults.length > 0) {
        // Calculate median of approx_t_s
        const times = validResults.map(r => r.approx_t_s);
        const medianTime = calculateMedian(times);
        
        // Calculate median window (median of starts and ends)
        const windowStarts = validResults.map(r => r.window_s[0]);
        const windowEnds = validResults.map(r => r.window_s[1]);
        const medianWindow: [number, number] = [
          calculateMedian(windowStarts),
          calculateMedian(windowEnds)
        ];
        
        console.log("Median collision time:", medianTime, "seconds");
        console.log("Median window:", medianWindow);
        
        setResults({
          individualResults: validResults,
          medianTime,
          medianWindow
        });
      } else {
        console.error("No valid results received from API calls");
      }
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
        {isLoading && <p>⏳ Analyzing video (8 parallel calls)...</p>}
        {results && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Analysis Results</h3>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <p style={{ margin: '5px 0' }}><strong>Median Collision Time:</strong> <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#2e7d32' }}>{results.medianTime.toFixed(1)}s</span></p>
              <p style={{ margin: '5px 0' }}><strong>Median Window:</strong> <span style={{ fontWeight: 'bold' }}>[{results.medianWindow[0].toFixed(1)}s - {results.medianWindow[1].toFixed(1)}s]</span></p>
              {videoDuration && (
                <p style={{ margin: '5px 0', color: '#666' }}><strong>Video Duration:</strong> {videoDuration.toFixed(1)}s</p>
              )}
            </div>
            
            {/* Video Sections Display */}
            {sections && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px' }}>Video Sections</h4>
                
                {/* Visual timeline bar */}
                <div style={{ 
                  display: 'flex', 
                  height: '40px', 
                  borderRadius: '6px', 
                  overflow: 'hidden',
                  marginBottom: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {sections.map((section) => {
                    const widthPercent = videoDuration ? (section.duration / videoDuration) * 100 : 0
                    const colors = {
                      ante: { bg: '#90caf9', border: '#1976d2' },
                      event: { bg: '#ef5350', border: '#c62828' },
                      post: { bg: '#a5d6a7', border: '#388e3c' }
                    }
                    return (
                      <div
                        key={section.name}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: colors[section.name].bg,
                          borderLeft: section.name !== 'ante' ? `2px solid ${colors[section.name].border}` : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1a1a1a',
                          fontWeight: 'bold',
                          fontSize: '0.85em',
                          minWidth: widthPercent > 5 ? 'auto' : '0'
                        }}
                        title={`${section.label}: ${section.start.toFixed(1)}s - ${section.end.toFixed(1)}s (${section.duration.toFixed(1)}s)`}
                      >
                        {widthPercent > 10 && section.label}
                      </div>
                    )
                  })}
                </div>

                {/* Section details table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ddd' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Section</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Start</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>End</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => {
                      const rowColors = {
                        ante: '#e3f2fd',
                        event: '#ffebee',
                        post: '#e8f5e9'
                      }
                      return (
                        <tr key={section.name} style={{ backgroundColor: rowColors[section.name], borderBottom: '1px solid #ccc' }}>
                          <td style={{ padding: '8px', fontWeight: section.name === 'event' ? 'bold' : 'normal' }}>
                            {section.name === 'event' ? '⚡ ' : ''}{section.label}
                          </td>
                          <td style={{ padding: '8px' }}>{section.start.toFixed(1)}s</td>
                          <td style={{ padding: '8px' }}>{section.end.toFixed(1)}s</td>
                          <td style={{ padding: '8px' }}>{section.duration.toFixed(1)}s</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Individual Results ({results.individualResults.length} responses)</summary>
              <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ddd' }}>
                    <th style={{ padding: '5px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '5px', textAlign: 'left' }}>Time (s)</th>
                    <th style={{ padding: '5px', textAlign: 'left' }}>Window</th>
                  </tr>
                </thead>
                <tbody>
                  {results.individualResults.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                      <td style={{ padding: '5px' }}>{i + 1}</td>
                      <td style={{ padding: '5px' }}>{r.approx_t_s.toFixed(1)}</td>
                      <td style={{ padding: '5px' }}>[{r.window_s[0].toFixed(1)} - {r.window_s[1].toFixed(1)}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        )}
      </div>

      <VideoPlayer file={selectedFile} />
      
      <button 
        onClick={handleAnalyze} 
        disabled={!selectedFile || isLoading}
      >
        Analyze Video
      </button>
      
      {/* Hidden video element to get duration */}
      <video ref={hiddenVideoRef} style={{ display: 'none' }} />
    </div>
  )
}
