'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'

const STEPS = [
  { text: 'Reading contract...', duration: 1500 },
  { text: 'Extracting 47 commercial parameters...', duration: 2000 },
  { text: 'Building validation model...', duration: 1500 },
]

interface ExtractionAnimationProps {
  onComplete?: () => void
}

export function ExtractionAnimation({ onComplete }: ExtractionAnimationProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let elapsed = 0
    const total = STEPS.reduce((s, st) => s + st.duration, 0)
    const tick = 50
    const interval = setInterval(() => {
      elapsed += tick
      setProgress(Math.min((elapsed / total) * 100, 100))

      let cumulative = 0
      for (let i = 0; i < STEPS.length; i++) {
        cumulative += STEPS[i].duration
        if (elapsed < cumulative) { setStepIndex(i); break }
      }

      if (elapsed >= total) {
        clearInterval(interval)
        setTimeout(() => onComplete?.(), 300)
      }
    }, tick)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="space-y-4 py-6">
      <div className="text-center space-y-2">
        <div className="text-sm font-medium text-[--color-wolvio-navy] animate-pulse">
          {STEPS[stepIndex]?.text}
        </div>
        <div className="flex justify-center gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i <= stepIndex ? 'bg-[--color-wolvio-orange]' : 'bg-[--color-mid]'}`}
            />
          ))}
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  )
}
