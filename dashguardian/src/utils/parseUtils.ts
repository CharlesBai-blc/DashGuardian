import type { AnalysisResult } from '../types'

export const parseJsonResponse = (text: string): AnalysisResult | null => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (
        typeof parsed.approx_t_s === 'number' &&
        Array.isArray(parsed.window_s) &&
        ['victim', 'offender', 'witness'].includes(parsed.fault)
      ) {
        return {
          approx_t_s: parsed.approx_t_s,
          window_s: parsed.window_s as [number, number],
          fault: parsed.fault as 'victim' | 'offender' | 'witness'
        }
      }
    }
    return null
  } catch {
    console.error('Failed to parse JSON:', text)
    return null
  }
}
