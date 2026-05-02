'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'

interface ExtractionAnimationProps {
  contractId?: string | null
  onComplete?: () => void
}

export function ExtractionAnimation({ contractId, onComplete }: ExtractionAnimationProps) {
  const [currentStep, setCurrentStep] = useState('Initializing...')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!contractId) return

    let pollInterval: NodeJS.Timeout
    let progressInterval: NodeJS.Timeout

    const poll = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.extraction_status === 'failed') {
          setError(data.extraction_error || 'Extraction failed')
          clearInterval(pollInterval)
          clearInterval(progressInterval)
          return
        }

        const step = data.parameters?.current_step
        if (step && step !== currentStep) {
          if (!completedSteps.includes(currentStep) && !currentStep.includes('Initializing')) {
            setCompletedSteps(prev => [...prev, currentStep])
          }
          setCurrentStep(step)
        }

        if (data.extraction_status === 'completed') {
          setCompletedSteps(prev => [...prev, step])
          setCurrentStep('Complete — Extraction finalized')
          setProgress(100)
          clearInterval(pollInterval)
          clearInterval(progressInterval)
          setTimeout(() => onComplete?.(), 1000)
        }
      } catch (err) {
        console.error('Polling failed', err)
      }
    }

    pollInterval = setInterval(poll, 1000)
    
    // Fake progress bar that slows down as it gets higher
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        const increment = (100 - prev) / 40
        return prev + increment
      })
    }, 200)

    return () => {
      clearInterval(pollInterval)
      clearInterval(progressInterval)
    }
  }, [contractId, currentStep, completedSteps, onComplete])

  if (error) {
    return (
      <div className="py-10 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-red-500/10 rounded-full">
            <AlertCircle className="text-[#EF4444]" size={32} />
          </div>
        </div>
        <h3 className="text-lg font-heading font-bold text-[--color-wolvio-light]">Extraction Error</h3>
        <p className="text-sm text-red-400 max-w-xs mx-auto font-medium leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-sm font-bold text-[--color-wolvio-orange] hover:underline"
        >
          Try another file
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-6 w-full">
      <div className="space-y-4">
        {completedSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
              <Check className="text-[#22C55E]" size={12} strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-[--color-wolvio-mid]">{step}</span>
          </div>
        ))}
        
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <Loader2 className="text-[--color-wolvio-orange] animate-spin" size={16} />
          </div>
          <span className="text-base font-heading font-bold text-[--color-wolvio-light] animate-pulse">
            {currentStep}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 w-full bg-[--color-wolvio-slate] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[--color-wolvio-orange] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-[--color-wolvio-mid] uppercase tracking-widest">
          <span>AI Processor Active</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  )
}

