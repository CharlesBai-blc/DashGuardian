import { useState, useRef, useEffect } from 'react'
import { VideoPlayer } from './VideoPlayer'
import promptsData from './prompts.json'

interface AnalysisResult {
  approx_t_s: number
  window_s: [number, number]
  fault: 'victim' | 'offender' | 'witness'
}

interface VideoSection {
  name: 'ante' | 'event' | 'post'
  label: string
  start: number
  end: number
  duration: number
}

interface SectionDescription {
  section: 'ante' | 'event' | 'post'
  description: string
  isLoading: boolean
  error?: string
}

interface AggregatedResults {
  individualResults: AnalysisResult[]
  medianTime: number
  medianWindow: [number, number]
  detectedFault: 'victim' | 'offender' | 'witness'
}

interface PromptConfig {
  ante: string;
  event: string;
  post: string;
}

interface PromptsData {
  [key: string]: PromptConfig;
}

export function VideoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<AggregatedResults | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [sections, setSections] = useState<VideoSection[] | null>(null)
  const [sectionDescriptions, setSectionDescriptions] = useState<SectionDescription[]>([])
  const [isDescribing, setIsDescribing] = useState(false)
  const hiddenVideoRef = useRef<HTMLVideoElement>(null)
  const [base64VideoCache, setBase64VideoCache] = useState<string | null>(null)

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
      setSectionDescriptions([]);
      setBase64VideoCache(null);
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
        if (
          typeof parsed.approx_t_s === 'number' && 
          Array.isArray(parsed.window_s) &&
          ['victim', 'offender', 'witness'].includes(parsed.fault)
        ) {
          return {
            approx_t_s: parsed.approx_t_s,
            window_s: parsed.window_s as [number, number],
            fault: parsed.fault as 'victim' | 'offender' | 'witness'
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
          "model": "google/gemini-3-flash-preview",
          "response_format": { "type": "json_object" },
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": `Watch the entire video. Identify the first physical contact (collision) using this definition: first frame where bodies touch. Consider sudden and heavy camera movement as a very clear indication of collision.

                          Identify who is at fault or the POV vehicle's role:
                          - "victim": POV vehicle was hit or followed all rules while another caused the crash.
                          - "offender": POV vehicle caused the crash or broke rules leading to it.
                          - "witness": POV vehicle was not involved in the crash but witnessed it.

                          Return ONLY JSON with:
                          - approx_t_s (seconds from start, to nearest 0.1s)
                          - window_s as [start, end] (a 2–4 second window that definitely contains first contact)
                          - fault ("victim", "offender", or "witness")

                          Example response: {"approx_t_s": 5.2, "window_s": [4.0, 7.0], "fault": "victim"}`
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

  const describeSectionCall = async (
    base64Video: string, 
    apiKey: string, 
    section: VideoSection
  ): Promise<string> => {
    // Get prompts for current detected fault perspective
    const allPrompts = promptsData as PromptsData;
    const perspective = results?.detectedFault || 'victim';
    const perspectivePrompts = allPrompts[perspective] || allPrompts.victim;
    const rawPrompt = perspectivePrompts[section.name as keyof PromptConfig];
    
    // Replace placeholders
    const finalPrompt = rawPrompt
      .replace('{{start}}', section.start.toFixed(1))
      .replace('{{end}}', section.end.toFixed(1));

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-3-flash-preview",
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": finalPrompt
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
      console.log(`${section.name} description:`, content);
      return content || "No description available";
    } catch (error) {
      console.error(`Error describing ${section.name}:`, error);
      throw error;
    }
  };

  const handleDescribeSections = async () => {
    if (!sections || !selectedFile) return;

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("API key not configured");
      return;
    }

    setIsDescribing(true);
    
    // Initialize descriptions with loading state
    setSectionDescriptions(
      sections.map(s => ({
        section: s.name,
        description: '',
        isLoading: true
      }))
    );

    try {
      // Use cached base64 or convert
      let base64Video = base64VideoCache;
      if (!base64Video) {
        base64Video = await convertFileToBase64(selectedFile);
        setBase64VideoCache(base64Video);
      }

      // Make parallel calls for all sections
      console.log("Describing all 3 sections in parallel...");
      const promises = sections.map(section => 
        describeSectionCall(base64Video!, apiKey, section)
          .then(description => ({ section: section.name, description, isLoading: false }))
          .catch(error => ({ section: section.name, description: '', isLoading: false, error: error.message }))
      );

      const results = await Promise.all(promises);
      setSectionDescriptions(results as SectionDescription[]);
    } catch (error) {
      console.error("Error describing sections:", error);
    } finally {
      setIsDescribing(false);
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
      setSectionDescriptions([]);
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.");
      }

      // Convert file to base64 and cache it
      const base64Video = await convertFileToBase64(selectedFile);
      setBase64VideoCache(base64Video);

      // Make 5 parallel API calls
      console.log("Making 5 parallel API calls...");
      const promises = Array.from({ length: 5 }, () => makeAnalysisCall(base64Video, apiKey));
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
        
        // Determine majority fault
        const faultCounts = validResults.reduce((acc, curr) => {
          acc[curr.fault] = (acc[curr.fault] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const detectedFault = Object.entries(faultCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0] as 'victim' | 'offender' | 'witness';
        console.log("Detected fault/perspective:", detectedFault);

        setResults({
          individualResults: validResults,
          medianTime,
          medianWindow,
          detectedFault
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
          <p style={{ color: '#64b5f6', marginBottom: '10px' }}>
            ✓ {selectedFile.name} selected
          </p>
        )}
        {isLoading && <p>⏳ Analyzing video (5 parallel calls)...</p>}
        {results && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: 'inherit' }}>Analysis Results</h3>
            <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: 'rgba(76, 175, 80, 0.15)', borderRadius: '6px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <p style={{ margin: '5px 0', color: 'inherit' }}><strong>Median Collision Time:</strong> <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#66bb6a' }}>{results.medianTime.toFixed(1)}s</span></p>
              <p style={{ margin: '5px 0', color: 'inherit' }}><strong>Median Window:</strong> <span style={{ fontWeight: 'bold' }}>[{results.medianWindow[0].toFixed(1)}s - {results.medianWindow[1].toFixed(1)}s]</span></p>
              <p style={{ margin: '5px 0', color: 'inherit' }}><strong>Detected Perspective:</strong> <span style={{ fontWeight: 'bold', textTransform: 'capitalize', color: results.detectedFault === 'offender' ? '#ef5350' : '#64b5f6' }}>{results.detectedFault}</span></p>
              {videoDuration && (
                <p style={{ margin: '5px 0', color: 'rgba(255,255,255,0.6)' }}><strong>Video Duration:</strong> {videoDuration.toFixed(1)}s</p>
              )}
            </div>
            
            {/* Video Sections Display */}
            {sections && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px', color: 'inherit' }}>Video Sections</h4>
                
                {/* Visual timeline bar */}
                <div style={{ 
                  display: 'flex', 
                  height: '44px', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  marginBottom: '15px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {sections.map((section) => {
                    const widthPercent = videoDuration ? (section.duration / videoDuration) * 100 : 0
                    const colors = {
                      ante: { bg: '#1e88e5', text: '#fff' },
                      event: { bg: '#e53935', text: '#fff' },
                      post: { bg: '#43a047', text: '#fff' }
                    }
                    return (
                      <div
                        key={section.name}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: colors[section.name].bg,
                          borderLeft: section.name !== 'ante' ? '2px solid rgba(0,0,0,0.3)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors[section.name].text,
                          fontWeight: 'bold',
                          fontSize: '0.85em',
                          minWidth: widthPercent > 5 ? 'auto' : '0',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
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
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Section</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Start</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>End</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => {
                      const rowColors = {
                        ante: 'rgba(30, 136, 229, 0.15)',
                        event: 'rgba(229, 57, 53, 0.15)',
                        post: 'rgba(67, 160, 71, 0.15)'
                      }
                      const textColors = {
                        ante: '#64b5f6',
                        event: '#ef5350',
                        post: '#81c784'
                      }
                      return (
                        <tr key={section.name} style={{ backgroundColor: rowColors[section.name], borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '10px', fontWeight: section.name === 'event' ? 'bold' : 'normal', color: textColors[section.name] }}>
                            {section.name === 'event' ? '⚡ ' : ''}{section.label}
                          </td>
                          <td style={{ padding: '10px', color: 'inherit' }}>{section.start.toFixed(1)}s</td>
                          <td style={{ padding: '10px', color: 'inherit' }}>{section.end.toFixed(1)}s</td>
                          <td style={{ padding: '10px', color: 'inherit' }}>{section.duration.toFixed(1)}s</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Describe Sections Button */}
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={handleDescribeSections}
                    disabled={isDescribing}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#7c4dff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isDescribing ? 'not-allowed' : 'pointer',
                      opacity: isDescribing ? 0.7 : 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {isDescribing ? '⏳ Describing Sections...' : '🔍 Describe All Sections'}
                  </button>
                </div>

                {/* Section Descriptions */}
                {sectionDescriptions.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '15px', color: 'inherit' }}>Section Descriptions</h4>
                    {sections.map((section) => {
                      const desc = sectionDescriptions.find(d => d.section === section.name);
                      const borderColors = {
                        ante: '#1e88e5',
                        event: '#e53935',
                        post: '#43a047'
                      };
                      const bgColors = {
                        ante: 'rgba(30, 136, 229, 0.1)',
                        event: 'rgba(229, 57, 53, 0.1)',
                        post: 'rgba(67, 160, 71, 0.1)'
                      };
                      const headerColors = {
                        ante: '#64b5f6',
                        event: '#ef5350',
                        post: '#81c784'
                      };
                      
                      return (
                        <div
                          key={section.name}
                          style={{
                            marginBottom: '15px',
                            padding: '15px',
                            backgroundColor: bgColors[section.name],
                            borderLeft: `4px solid ${borderColors[section.name]}`,
                            borderRadius: '0 8px 8px 0'
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '10px'
                          }}>
                            <h5 style={{ 
                              margin: 0, 
                              color: headerColors[section.name],
                              fontSize: '1.1em'
                            }}>
                              {section.name === 'event' ? '⚡ ' : ''}{section.label}
                              <span style={{ 
                                fontWeight: 'normal', 
                                fontSize: '0.85em', 
                                color: 'rgba(255,255,255,0.5)',
                                marginLeft: '10px'
                              }}>
                                ({section.start.toFixed(1)}s - {section.end.toFixed(1)}s)
                              </span>
                            </h5>
                          </div>
                          
                          {desc?.isLoading ? (
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: 0 }}>
                              ⏳ Analyzing this section...
                            </p>
                          ) : desc?.error ? (
                            <p style={{ color: '#ef5350', margin: 0 }}>
                              ❌ Error: {desc.error}
                            </p>
                          ) : desc?.description ? (
                            <p style={{ 
                              color: 'rgba(255,255,255,0.9)', 
                              margin: 0,
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {desc.description}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', padding: '8px 0' }}>Individual Results ({results.individualResults.length} responses)</summary>
              <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>#</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Time (s)</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Window</th>
                  </tr>
                </thead>
                <tbody>
                  {results.individualResults.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '8px', color: 'rgba(255,255,255,0.6)' }}>{i + 1}</td>
                      <td style={{ padding: '8px', color: 'inherit' }}>{r.approx_t_s.toFixed(1)}</td>
                      <td style={{ padding: '8px', color: 'inherit' }}>[{r.window_s[0].toFixed(1)} - {r.window_s[1].toFixed(1)}]</td>
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
