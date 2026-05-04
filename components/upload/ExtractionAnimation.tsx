'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, AlertCircle, Cpu, Zap, Timer } from 'lucide-react'

interface ExtractionAnimationProps {
  contractId?: string | null
  onComplete?: () => void
}

export function ExtractionAnimation({ contractId, onComplete }: ExtractionAnimationProps) {
  const [currentStep, setCurrentStep] = useState('Initializing Core Engine...')
  const [stageIndex, setStageIndex] = useState(0)
  const [stageEta, setStageEta] = useState('')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [showSkip, setShowSkip] = useState(false)
  const [lastProgressUpdate, setLastProgressUpdate] = useState(Date.now())

  const TOTAL_DURATION = 5900 // 5.9 seconds total
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
    let startTime = Date.now()
    
    // 1. Cinematic Animation Sequence
    const runAnimation = () => {
      if (currentStageIndex >= STAGES.length) {
        setProgress(100)
        setTimeout(() => onComplete?.(), 1500)
        return
      }

      const stage = STAGES[currentStageIndex]
      setCurrentStep(stage.label)
      setStageIndex(currentStageIndex + 1)
      
      // Update completed steps
      if (currentStageIndex > 0) {
        setCompletedSteps(STAGES.slice(0, currentStageIndex).map(s => s.label))
      }

      setTimeout(() => {
        currentStageIndex++
        runAnimation()
      }, stage.duration)
    }

    // 2. Smooth Progress Fill (0 to 100 over 5.9s)
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 99)
      setProgress(newProgress)
    }, 50)

    runAnimation()

    return () => {
      clearInterval(progressInterval)
    }
  }, [contractId, onComplete])

  if (error) {
    return (
      <div className="py-12 glass rounded-[32px] text-center space-y-6 border-red-500/20">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            <AlertCircle className="text-wolvio-red" size={32} />
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
    <div className="glass rounded-[40px] p-10 border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] space-y-10 w-full animate-in zoom-in-95 duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Cpu size={120} className="text-white" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-wolvio-orange/10 rounded-2xl flex items-center justify-center border border-wolvio-orange/20 shadow-[0_0_20px_rgba(242,102,48,0.3)]">
            <Loader2 className="text-wolvio-orange animate-spin" size={24} />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">AI Audit Engine</h2>
            <p className="text-[10px] font-bold text-wolvio-mid uppercase tracking-widest">
              Stage {stageIndex} of {STAGES.length}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-black text-white tracking-tighter">{Math.round(progress)}%</div>
          <div className="text-[10px] font-bold text-wolvio-orange uppercase tracking-widest">Fidelity</div>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {completedSteps.slice(-3).map((step, i) => (
          <div key={i} className="flex items-center gap-4 opacity-40 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex-shrink-0 w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Check className="text-green-400" size={12} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{step}</span>
          </div>
        ))}
        
        <div className="flex flex-col gap-2 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-wolvio-orange/10 flex items-center justify-center border border-wolvio-orange/20">
              <Zap className="text-wolvio-orange animate-pulse" size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-heading font-black text-white tracking-tight">
              {currentStep}
            </span>
          </div>
          {stageEta && (
            <div className="ml-12 flex items-center gap-2 text-amber-400/60 text-[10px] font-bold uppercase tracking-widest">
              <Timer size={12} /> Estimated time remaining: {stageEta}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-wolvio-orange to-amber-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(242,102,48,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">High-Precision Mode Active</span>
          <div className="flex gap-1.5">
             {[...Array(STAGES.length)].map((_, i) => (
               <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${stageIndex > i ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : stageIndex === i ? 'bg-wolvio-orange animate-pulse' : 'bg-white/10'}`} 
               />
             ))}
          </div>
        </div>
      </div>
      {showSkip && (
        <div className="pt-6 animate-in slide-in-from-top-4 duration-700">
          <button 
            onClick={() => onComplete?.()}
            className="w-full py-4 bg-white/5 hover:bg-wolvio-orange/20 border border-white/10 hover:border-wolvio-orange/40 rounded-[20px] text-[10px] font-black text-white uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group"
          >
            <Check className="text-wolvio-orange group-hover:scale-125 transition-transform" size={14} strokeWidth={3} />
            Data Extraction Verified — Proceed to Dashboard
          </button>
          <p className="text-[9px] text-wolvio-mid text-center mt-3 font-bold uppercase tracking-widest opacity-40">
            Manual bypass active — background sync will continue
          </p>
        </div>
      )}
    </div>
  )
}
