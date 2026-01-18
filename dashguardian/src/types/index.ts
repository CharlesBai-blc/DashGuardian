export interface AnalysisResult {
  approx_t_s: number
  window_s: [number, number]
  fault: 'victim' | 'offender' | 'witness'
}

export interface VideoSection {
  name: 'ante' | 'event' | 'post'
  label: string
  start: number
  end: number
  duration: number
}

export interface SectionDescription {
  section: 'ante' | 'event' | 'post'
  description: string
  isLoading: boolean
  error?: string
}

export interface AggregatedResults {
  individualResults: AnalysisResult[]
  medianTime: number
  medianWindow: [number, number]
  detectedFault: 'victim' | 'offender' | 'witness'
}

export interface PromptConfig {
  ante: string
  event: string
  post: string
}

export interface PromptsData {
  [key: string]: PromptConfig
}
