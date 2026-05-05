'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileUp, Loader2, Cpu, Database, ShieldCheck, Zap } from 'lucide-react'

interface InvoiceUploadProps {
  onUpload: (file: File) => void
  isProcessing: boolean
}

const DEMO_STEPS = [
  { icon: FileUp, text: "Processing Document..." },
  { icon: Database, text: "Parsing Data..." },
  { icon: Zap, text: "Finalizing Audit..." }
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
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all group relative">
      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform border border-slate-200 shadow-sm relative z-10">
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-wolvio-orange animate-spin" />
        ) : (
          <FileUp className="w-8 h-8 text-wolvio-orange" />
        )}
      </div>

      <div className="text-center space-y-2 relative z-10">
        <h3 className="text-xl font-heading font-black text-slate-900 uppercase tracking-tight">
          {isProcessing ? 'Auditing Invoice' : 'Upload Billing Document'}
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          {isProcessing 
            ? DEMO_STEPS[step].text 
            : 'Select a PDF invoice to begin the deterministic contract validation.'}
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
          className="bg-wolvio-orange hover:bg-orange-700 text-white px-8 py-6 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg transition-all"
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
        <div className="mt-12 flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Digital PDF Only</div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI-Powered Audit</div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">SOC2 Compliant</div>
        </div>
      )}
    </div>
  )
}
