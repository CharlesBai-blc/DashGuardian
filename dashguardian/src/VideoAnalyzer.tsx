import { useState } from 'react'
import { VideoPlayer } from './VideoPlayer'

interface AnalysisResult {
  approx_t_s: number
  window_s: [number, number]
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
            </div>
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
    </div>
  )
}
