'use client'

import { useEffect, useState } from 'react'

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
    const tick = 20 // Smoother tick
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
    <div className="space-y-6 py-10 max-w-md mx-auto w-full">
      <div className="text-center space-y-4">
        {/* Smooth fade wrapper */}
        <div className="h-8 relative overflow-hidden">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`absolute inset-0 w-full text-lg font-heading font-semibold text-[--color-wolvio-navy] transition-all duration-500 ease-in-out ${
                i === stepIndex ? 'opacity-100 translate-y-0' : i < stepIndex ? 'opacity-0 -translate-y-4' : 'opacity-0 translate-y-4'
              }`}
            >
              {step.text}
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-[--color-wolvio-light] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[--color-wolvio-orange] transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-[--color-wolvio-slate] px-1 uppercase tracking-wider">
            <span>Processing</span>
            <span>Step {stepIndex + 1}/{STEPS.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
