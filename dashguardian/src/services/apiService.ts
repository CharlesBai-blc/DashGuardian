import type { AnalysisResult, VideoSection, PromptConfig, PromptsData, StructuredSectionDescription } from '../types'
import promptsData from '../prompts.json'
import { parseJsonResponse } from '../utils'

const MODEL = 'gemini-3-flash-preview'

const getGeminiUrl = (apiKey: string) => 
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`

const extractBase64 = (dataUri: string): string => {
  const match = dataUri.match(/^data:video\/\w+;base64,(.+)$/)
  return match ? match[1] : dataUri
}

const getMimeType = (dataUri: string): string => {
  const match = dataUri.match(/^data:(video\/\w+);base64,/)
  return match ? match[1] : 'video/mp4'
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message: string
    code: number
  }
}

const extractGeminiContent = (data: GeminiResponse): string | null => {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
}

const ANALYSIS_PROMPT = `Watch the entire video carefully. Your task is to objectively analyze the incident and determine the POV vehicle's role.

**DIRECTION REFERENCE:** This is dashcam footage. The left side of the frame is the driver's LEFT. The right side of the frame is the driver's RIGHT. If something moves toward the left edge of the frame, it is moving LEFT. If something moves toward the right edge of the frame, it is moving RIGHT.

**Step 1: Identify the collision moment**
Find the first frame where physical contact occurs between vehicles. Look for:
- Visual contact between vehicles
- Sudden camera movement or jolt indicating impact
- Change in vehicle trajectories at the moment of contact

**Step 2: Critically analyze the POV vehicle's actions**
IMPORTANT: Do NOT default to "victim". Carefully examine what the POV vehicle did:
- Did the POV vehicle rear-end another vehicle? (This makes POV the offender)
- Did the POV vehicle fail to brake in time?
- Did the POV vehicle change lanes unsafely?
- Did the POV vehicle run a red light or stop sign?
- Did the POV vehicle fail to yield when required?
- Was the POV vehicle speeding or following too closely?
- Could the POV vehicle have reasonably avoided the collision?

**Step 3: Analyze other vehicles' actions**
- What were other vehicles doing?
- Did another vehicle cause the collision through their actions?
- Was the other vehicle's behavior unpredictable or illegal?

**Step 4: Determine the POV vehicle's role**

**"offender"** - ASSIGN THIS IF:
- The POV vehicle rear-ended another vehicle
- The POV vehicle failed to stop or brake in time
- The POV vehicle made an unsafe lane change
- The POV vehicle ran a signal or sign
- The POV vehicle failed to yield right-of-way
- The POV vehicle's actions directly caused the collision
- The collision was preventable by the POV vehicle

**"victim"** - ASSIGN THIS ONLY IF:
- Another vehicle clearly struck the POV vehicle
- Another vehicle's illegal or unsafe action caused the collision
- The POV vehicle had no reasonable way to avoid the collision
- The POV vehicle was obeying traffic laws and was hit by another

**"witness"** - The POV vehicle was not involved in any collision

Return ONLY valid JSON with:
- approx_t_s: The collision time in seconds from video start (to nearest 0.1s)
- window_s: A 2-4 second time window [start, end] that definitely contains the first contact
- fault: One of "victim", "offender", or "witness" based on your objective analysis

Example response: {"approx_t_s": 5.2, "window_s": [4.0, 7.0], "fault": "offender"}`

export const makeAnalysisCall = async (
  base64Video: string,
  apiKey: string
): Promise<AnalysisResult | null> => {
  try {
    const response = await fetch(getGeminiUrl(apiKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType: getMimeType(base64Video),
                data: extractBase64(base64Video)
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('Gemini API error:', data.error)
      return null
    }
    
    const content = extractGeminiContent(data)
    if (content) {
      return parseJsonResponse(content)
    }
    return null
  } catch (error) {
    console.error('Error in analysis call:', error)
    return null
  }
}

export const describeSectionCall = async (
  base64Video: string,
  apiKey: string,
  section: VideoSection,
  detectedFault: 'victim' | 'offender' | 'witness'
): Promise<StructuredSectionDescription> => {
  const allPrompts = promptsData as PromptsData
  const perspectivePrompts = allPrompts[detectedFault] || allPrompts.victim
  const rawPrompt = perspectivePrompts[section.name as keyof PromptConfig]

  const finalPrompt = rawPrompt
    .replace('{{start}}', section.start.toFixed(1))
    .replace('{{end}}', section.end.toFixed(1))

  try {
    const response = await fetch(getGeminiUrl(apiKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: finalPrompt },
            {
              inlineData: {
                mimeType: getMimeType(base64Video),
                data: extractBase64(base64Video)
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error(`Gemini API error for ${section.name}:`, data.error)
      return {}
    }
    
    const content = extractGeminiContent(data)
    
    if (content) {
      try {
        const parsed = JSON.parse(content)
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as StructuredSectionDescription
        }
      } catch (parseError) {
        console.error(`Error parsing JSON for ${section.name}:`, parseError)
      }
    }
    
    return {}
  } catch (error) {
    console.error(`Error describing ${section.name}:`, error)
    throw error
  }
}

const SUMMARY_PROMPT = `Watch the entire video and provide a narrative summary of the incident.

**DIRECTION REFERENCE:** This is dashcam footage. The left side of the frame is the driver's LEFT. The right side of the frame is the driver's RIGHT. If something moves toward the left edge of the frame, it is moving LEFT. If something moves toward the right edge of the frame, it is moving RIGHT.

STRICT LIMITS: Maximum 5 sentences and 80 words total. Be concise.

IMPORTANT: Start directly with your analysis. Do NOT include any prefixes, introductory phrases, or words like "thought", "analysis", "summary", or "here is". Begin immediately with the narrative content.

Describe:
- What happened: A clear description of the collision/incident
- Who was involved: Identify all vehicles and parties involved
- Key events: The sequence of events leading up to and including the collision
- Context: Road conditions, traffic situation, and environmental factors
- Outcome: The immediate aftermath and final state

Refer to the dashcam vehicle ONLY as "POV vehicle". Describe other vehicles by their appearance (e.g., "red sedan", "white truck").

Provide a concise, objective narrative summary in exactly 5 sentences or fewer, with a maximum of 80 words. Start directly with the narrative - no introductory text.`

export const generateVideoSummary = async (
  base64Video: string,
  apiKey: string
): Promise<string> => {
  try {
    const response = await fetch(getGeminiUrl(apiKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SUMMARY_PROMPT },
            {
              inlineData: {
                mimeType: getMimeType(base64Video),
                data: extractBase64(base64Video)
              }
            }
          ]
        }]
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('Gemini API error:', data.error)
      return 'Summary not available'
    }
    
    const content = extractGeminiContent(data)
    return content || 'Summary not available'
  } catch (error) {
    console.error('Error generating video summary:', error)
    throw error
  }
}
