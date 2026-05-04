'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileUp, Loader2, Cpu, Database, ShieldCheck, Zap } from 'lucide-react'

interface InvoiceUploadProps {
  onUpload: (file: File) => void
  isProcessing: boolean
}

const DEMO_STEPS = [
  { icon: Cpu, text: "Initializing Wolvio Quantum OCR..." },
  { icon: Database, text: "Extracting Line Item Schemas..." },
  { icon: ShieldCheck, text: "Correlating with Master Service Agreement..." },
  { icon: Zap, text: "Running Variance Engine (WPI/LD)..." },
  { icon: FileUp, text: "Finalizing Executive Audit Report..." }
]

export function InvoiceUpload({ onUpload, isProcessing }: InvoiceUploadProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    let interval: any
    if (isProcessing) {
      interval = setInterval(() => {
        setStep(prev => (prev + 1) % DEMO_STEPS.length)
      }, 2500)
    } else {
      setStep(0)
    }
    return () => clearInterval(interval)
  }, [isProcessing])

  const CurrentIcon = DEMO_STEPS[step].icon

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-[40px] bg-white/[0.02] hover:bg-white/[0.05] hover:border-wolvio-orange/50 transition-all group relative overflow-hidden">
      {/* Background Pulse during processing */}
      {isProcessing && (
        <div className="absolute inset-0 bg-gradient-to-b from-wolvio-orange/5 to-transparent animate-pulse" />
      )}

      <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 relative z-10">
        {isProcessing ? (
          <CurrentIcon className="w-10 h-10 text-wolvio-orange animate-bounce" />
        ) : (
          <FileUp className="w-10 h-10 text-wolvio-orange" />
        )}
      </div>

      <div className="text-center space-y-3 relative z-10">
        <h3 className="text-2xl font-heading font-black text-white">
          {isProcessing ? 'Analyzing Audit' : 'Upload Client Invoice'}
        </h3>
        <p className="text-wolvio-mid text-sm max-w-sm mx-auto font-medium leading-relaxed">
          {isProcessing 
            ? DEMO_STEPS[step].text 
            : 'Drop a digital PDF invoice here to test high-precision extraction and contract validation in real-time.'}
        </p>
      </div>
      
      <div className="mt-10 relative z-10">
        <input
          type="file"
          id="invoice-upload"
          className="hidden"
          accept=".pdf"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          disabled={isProcessing}
        />
        <Button 
          asChild 
          disabled={isProcessing}
          className="bg-wolvio-orange hover:bg-[#d95a2b] text-white px-12 py-8 rounded-[24px] text-lg font-black shadow-[0_20px_60px_-15px_rgba(242,102,48,0.4)] transition-all disabled:opacity-50"
        >
          <label htmlFor="invoice-upload" className="cursor-pointer flex items-center gap-4">
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              'Select Invoice File'
            )}
          </label>
        </Button>
      </div>

      {/* Trust Badges */}
      {!isProcessing && (
        <div className="mt-12 flex items-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="text-[10px] font-black uppercase tracking-[0.3em]">Digital PDF Only</div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="text-[10px] font-black uppercase tracking-[0.3em]">AI-Powered Audit</div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="text-[10px] font-black uppercase tracking-[0.3em]">SOC2 Compliant</div>
        </div>
      )}
    </div>
  )
}
