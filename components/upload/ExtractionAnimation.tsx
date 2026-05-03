'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, AlertCircle, Cpu, Zap } from 'lucide-react'

interface ExtractionAnimationProps {
  contractId?: string | null
  onComplete?: () => void
}

export function ExtractionAnimation({ contractId, onComplete }: ExtractionAnimationProps) {
  const [currentStep, setCurrentStep] = useState('Initializing Core Engine...')
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
          setCurrentStep('Extraction Verified & Finalized')
          setProgress(100)
          clearInterval(pollInterval)
          clearInterval(progressInterval)
          setTimeout(() => onComplete?.(), 1000)
        }
      } catch (err) {
        console.error('Polling failed', err)
      }
    }

    pollInterval = setInterval(poll, 1200)
    
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev
        const increment = (100 - prev) / 50
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
      <div className="py-12 glass rounded-[32px] text-center space-y-6 border-red-500/20">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            <AlertCircle className="text-[--color-wolvio-red]" size={32} />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-black text-white uppercase tracking-tight">Engine Failure</h3>
          <p className="text-sm text-red-400 max-w-xs mx-auto font-bold leading-relaxed">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white/60 transition-all"
        >
          Reset Session
        </button>
      </div>
    )
  }

  return (
    <div className="glass rounded-[40px] p-10 border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] space-y-10 w-full animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[--color-wolvio-orange]/10 rounded-2xl flex items-center justify-center border border-[--color-wolvio-orange]/20 shadow-[0_0_20px_rgba(242,102,48,0.3)]">
            <Cpu className="text-[--color-wolvio-orange] animate-pulse" size={24} />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">AI Intelligence</h2>
            <p className="text-[10px] font-bold text-[--color-wolvio-mid] uppercase tracking-widest">Processing Document Flow</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-black text-white tracking-tighter">{Math.round(progress)}%</div>
          <div className="text-[10px] font-bold text-[--color-wolvio-orange] uppercase tracking-widest">Progress</div>
        </div>
      </div>

      <div className="space-y-4">
        {completedSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex-shrink-0 w-6 h-6 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Check className="text-green-400" size={14} strokeWidth={3} />
            </div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{step}</span>
          </div>
        ))}
        
        <div className="flex items-center gap-4 py-2">
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            <Zap className="text-[--color-wolvio-orange] animate-bounce" size={20} fill="currentColor" />
          </div>
          <span className="text-lg font-heading font-black text-white tracking-tight">
            {currentStep}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-[--color-wolvio-orange] to-amber-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(242,102,48,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">High-Precision Mode Active</span>
          <div className="flex gap-1">
             {[...Array(5)].map((_, i) => (
               <div key={i} className={`w-1 h-1 rounded-full ${progress > (i+1)*20 ? 'bg-[--color-wolvio-orange]' : 'bg-white/10'}`} />
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
