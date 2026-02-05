import { useState, useEffect, useCallback } from 'react'
import { cn } from '../../lib/utils'

interface ExamTimerProps {
  startTime: string
  timeLimitMinutes: number
  onTimeUp: () => void
}

export function ExamTimer({ startTime, timeLimitMinutes, onTimeUp }: ExamTimerProps) {
  const calculateRemaining = useCallback(() => {
    const start = new Date(startTime).getTime()
    const deadline = start + timeLimitMinutes * 60 * 1000
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000))
  }, [startTime, timeLimitMinutes])

  const [remaining, setRemaining] = useState(calculateRemaining)

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemaining = calculateRemaining()
      setRemaining(newRemaining)

      if (newRemaining <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateRemaining, onTimeUp])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isWarning = remaining <= 300 // 5 minutes
  const isCritical = remaining <= 60  // 1 minute

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium',
        isCritical
          ? 'animate-pulse bg-danger-100 text-danger-700'
          : isWarning
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-secondary-100 text-secondary-700'
      )}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
