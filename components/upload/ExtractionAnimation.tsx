'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, AlertCircle, Zap } from 'lucide-react'

interface ExtractionAnimationProps {
  contractId?: string | null
  onComplete?: () => void
}

export function ExtractionAnimation({ contractId, onComplete }: ExtractionAnimationProps) {
  const [currentStep, setCurrentStep] = useState('Initializing Core Engine...')
  const [stageIndex, setStageIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const TOTAL_DURATION = 5900
  const STAGES = [
    { label: "Scanning document structure...", duration: 1000 },
    { label: "Detecting clause boundaries...", duration: 800 },
    { label: "Extracting commercial parameters...", duration: 1200 },
    { label: "Validating against schema...", duration: 600 },
    { label: "Scoring confidence levels...", duration: 800 },
    { label: "Building Digital Twin...", duration: 1000 },
    { label: "Complete — 47 data points extracted", duration: 500 },
  ]

  useEffect(() => {
    if (!contractId) return

    let currentStageIndex = 0
    const startTime = Date.now()

    const runAnimation = () => {
      if (currentStageIndex >= STAGES.length) {
        setProgress(100)
        setTimeout(() => onComplete?.(), 1500)
        return
      }

      const stage = STAGES[currentStageIndex]
      setCurrentStep(stage.label)
      setStageIndex(currentStageIndex + 1)

      if (currentStageIndex > 0) {
        setCompletedSteps(STAGES.slice(0, currentStageIndex).map(s => s.label))
      }

      setTimeout(() => {
        currentStageIndex++
        runAnimation()
      }, stage.duration)
    }

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 99)
      setProgress(newProgress)
    }, 50)

    runAnimation()

    return () => { clearInterval(progressInterval) }
  }, [contractId, onComplete])

  if (error) {
    return (
      <div className="py-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-black text-slate-900 uppercase tracking-tight">Engine Failure</h3>
          <p className="text-sm text-red-600 max-w-xs mx-auto font-medium leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest text-slate-600 transition-all"
        >
          Reset Session
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full animate-in zoom-in-95 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
            <Loader2 className="text-wolvio-orange animate-spin" size={22} />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.25em]">AI Audit Engine</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Stage {stageIndex} of {STAGES.length}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-black text-slate-900 tracking-tighter">{Math.round(progress)}%</div>
          <div className="text-[10px] font-bold text-wolvio-orange uppercase tracking-widest">Fidelity</div>
        </div>
      </div>

      {/* Steps log */}
      <div className="space-y-2">
        {completedSteps.slice(-3).map((step, i) => (
          <div key={i} className="flex items-center gap-3 opacity-50 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Check className="text-emerald-600" size={11} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{step}</span>
          </div>
        ))}

        {/* Current active step */}
        <div className="flex items-center gap-3 py-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
            <Zap className="text-wolvio-orange animate-pulse" size={18} fill="currentColor" />
          </div>
          <span className="text-base font-heading font-black text-slate-900 tracking-tight">
            {currentStep}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-wolvio-orange transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">High-Precision Mode Active</span>
          <div className="flex gap-1.5">
            {[...Array(STAGES.length)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  stageIndex > i
                    ? 'bg-emerald-500'
                    : stageIndex === i
                    ? 'bg-wolvio-orange animate-pulse'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
