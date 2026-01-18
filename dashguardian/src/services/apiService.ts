import type { AnalysisResult, VideoSection, PromptConfig, PromptsData } from '../types'
import promptsData from '../prompts.json'
import { parseJsonResponse } from '../utils'

const API_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-3-flash-preview'

const ANALYSIS_PROMPT = `Watch the entire video. Identify the first physical contact (collision) using this definition: first frame where bodies touch. Consider sudden and heavy camera movement as a very clear indication of collision.

Identify who is at fault or the POV vehicle's role:
- "victim": POV vehicle was hit or followed all rules while another caused the crash.
- "offender": POV vehicle caused the crash or broke rules leading to it.
- "witness": POV vehicle was not involved in the crash but witnessed it.

Return ONLY JSON with:
- approx_t_s (seconds from start, to nearest 0.1s)
- window_s as [start, end] (a 2–4 second window that definitely contains first contact)
- fault ("victim", "offender", or "witness")

Example response: {"approx_t_s": 5.2, "window_s": [4.0, 7.0], "fault": "victim"}`

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
): Promise<string> => {
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
    return content || 'No description available'
  } catch (error) {
    console.error(`Error describing ${section.name}:`, error)
    throw error
  }
}
