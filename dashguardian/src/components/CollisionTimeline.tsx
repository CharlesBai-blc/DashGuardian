interface CollisionTimelineProps {
  collisionTime: number // in seconds
  videoDuration: number // in seconds
}

export function CollisionTimeline({ collisionTime, videoDuration }: CollisionTimelineProps) {
  // Calculate start and end times (5 seconds before/after collision)
  const startTime = Math.max(0, collisionTime - 5)
  const endTime = Math.min(videoDuration, collisionTime + 5)

  // Calculate positions as percentages
  const startPos = (startTime / videoDuration) * 100
  const collisionPos = (collisionTime / videoDuration) * 100
  const endPos = (endTime / videoDuration) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      width: '100%',
      padding: '10px 0',
      boxSizing: 'border-box'
    }}>
      {/* Timeline container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '40px'
      }}>
        {/* Main line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: 'rgba(255,255,255,0.3)'
        }} />

        {/* Start marker */}
        <div style={{
          position: 'absolute',
          left: `${startPos}%`,
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#4CAF50',
            fontSize: '10px',
            fontFamily: '"Google Sans", sans-serif',
            marginBottom: '4px'
          }}>
            START
          </div>
          <div style={{
            width: '2px',
            height: '12px',
            backgroundColor: '#4CAF50',
            margin: '0 auto'
          }} />
          <div style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '9px',
            fontFamily: '"Google Sans", sans-serif',
            marginTop: '2px'
          }}>
            {formatTime(startTime)}
          </div>
        </div>

        {/* Collision marker */}
        <div style={{
          position: 'absolute',
          left: `${collisionPos}%`,
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#FF5252',
            fontSize: '10px',
            fontFamily: '"Google Sans", sans-serif',
            fontWeight: 600,
            marginBottom: '4px'
          }}>
            COLLISION
          </div>
          <div style={{
            width: '4px',
            height: '16px',
            backgroundColor: '#FF5252',
            margin: '0 auto',
            borderRadius: '2px'
          }} />
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '9px',
            fontFamily: '"Google Sans", sans-serif',
            marginTop: '2px'
          }}>
            {formatTime(collisionTime)}
          </div>
        </div>

        {/* End marker */}
        <div style={{
          position: 'absolute',
          left: `${endPos}%`,
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#2196F3',
            fontSize: '10px',
            fontFamily: '"Google Sans", sans-serif',
            marginBottom: '4px'
          }}>
            END
          </div>
          <div style={{
            width: '2px',
            height: '12px',
            backgroundColor: '#2196F3',
            margin: '0 auto'
          }} />
          <div style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '9px',
            fontFamily: '"Google Sans", sans-serif',
            marginTop: '2px'
          }}>
            {formatTime(endTime)}
          </div>
        </div>
      </div>
    </div>
  )
}
