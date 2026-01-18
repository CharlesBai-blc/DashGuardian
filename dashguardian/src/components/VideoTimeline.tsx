import type { VideoSection } from '../types'

interface VideoTimelineProps {
  sections: VideoSection[]
  videoDuration: number | null
}

const SECTION_COLORS = {
  ante: { bg: '#1e88e5', text: '#fff' },
  event: { bg: '#e53935', text: '#fff' },
  post: { bg: '#43a047', text: '#fff' }
}

export function VideoTimeline({ sections, videoDuration }: VideoTimelineProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '44px',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '15px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {sections.map((section) => {
        const widthPercent = videoDuration ? (section.duration / videoDuration) * 100 : 0
        return (
          <div
            key={section.name}
            style={{
              width: `${widthPercent}%`,
              backgroundColor: SECTION_COLORS[section.name].bg,
              borderLeft: section.name !== 'ante' ? '2px solid rgba(0,0,0,0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SECTION_COLORS[section.name].text,
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
  )
}
