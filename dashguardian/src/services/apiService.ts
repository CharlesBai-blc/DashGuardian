import type { AnalysisResult, VideoSection, PromptConfig, PromptsData, StructuredSectionDescription } from '../types'
import promptsData from '../prompts.json'
import { parseJsonResponse } from '../utils'

const API_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-3-flash-preview'

const ANALYSIS_PROMPT = `Watch the entire video. Identify the first physical contact (collision) using this definition: first frame where bodies touch. Consider sudden and heavy camera movement as a very clear indication of collision.

Identify who is at fault or the POV vehicle's role. Be very careful to analyze the POV vehicle's actions leading up to the collision:

**"victim"** - POV vehicle was hit by another vehicle that was at fault:
- POV vehicle was rear-ended while stopped or moving at constant speed
- POV vehicle was hit by someone running a red light or stop sign
- POV vehicle was sideswiped by someone changing lanes unsafely
- POV vehicle was hit from the side by someone failing to yield
- POV vehicle was legally proceeding when another vehicle caused the collision
- POV vehicle was severely braked-checked by the other vehicle for no reason

**"offender"** - POV vehicle caused the crash or violated traffic rules:
- POV vehicle rear-ended the vehicle in front (following too closely, not braking in time, or distracted)
- POV vehicle ran a red light or stop sign and struck another vehicle
- POV vehicle failed to yield and struck another vehicle
- POV vehicle changed lanes unsafely and struck another vehicle
- POV vehicle was speeding or driving aggressively and caused the collision
- POV vehicle struck a stationary or slower-moving vehicle from behind
- IMPORTANT: If the POV vehicle's front end strikes another vehicle's rear end, the POV vehicle is almost always the offender

**"witness"** - POV vehicle was not involved in the collision:
- POV vehicle observed a collision between other vehicles
- POV vehicle was nearby but did not make contact with any vehicle

Return ONLY JSON with:
- approx_t_s (seconds from start, to nearest 0.1s)
- window_s as [start, end] (a 2–4 second window that definitely contains first contact)
- fault ("victim", "offender", or "witness")

Example response: {"approx_t_s": 5.2, "window_s": [4.0, 7.0], "fault": "offender"}`

export const makeAnalysisCall = async (
  base64Video: string,
  apiKey: string
): Promise<AnalysisResult | null> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: ANALYSIS_PROMPT
              },
              {
                type: 'video_url',
                video_url: {
                  url: base64Video
                }
              }
            ]
          }
        ]
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    console.log('Raw API response:', content)
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
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: finalPrompt
              },
              {
                type: 'video_url',
                video_url: {
                  url: base64Video
                }
              }
            ]
          }
        ]
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    console.log(`${section.name} description:`, content)
    
    if (content) {
      try {
        const parsed = JSON.parse(content)
        // Validate it's an object with string values
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as StructuredSectionDescription
        }
      } catch (parseError) {
        console.error(`Error parsing JSON for ${section.name}:`, parseError)
      }
    }
    
    // Fallback: return empty structure
    return {}
  } catch (error) {
    console.error(`Error describing ${section.name}:`, error)
    throw error
  }
}

const SUMMARY_PROMPT = `Watch the entire video and provide a narrative summary of the incident.

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
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: SUMMARY_PROMPT
              },
              {
                type: 'video_url',
                video_url: {
                  url: base64Video
                }
              }
            ]
          }
        ]
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    console.log('Video summary:', content)
    return content || 'Summary not available'
  } catch (error) {
    console.error('Error generating video summary:', error)
    throw error
  }
}
