'use client'

import { useState, useEffect } from 'react'
import { InvoiceUpload } from './InvoiceUpload'
import { ValidationReport } from './ValidationReport'
import { ContractParameters } from '@/lib/schemas/contract'
import { Invoice } from '@/lib/schemas/invoice'
import { runValidation, GenerationData } from '@/lib/validation/engine'
import { ValidationResultSchema, ValidationResult } from '@/lib/schemas/validation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { InvoiceMappingModal } from './InvoiceMappingModal'
import { useDemoMode } from '@/components/DemoModeBadge'

interface ValidationViewProps {
  contract: ContractParameters
  initialInvoice: Invoice
  initialGeneration?: GenerationData
  contractId: string
}

export function ValidationView({ contract, initialInvoice, initialGeneration, contractId }: ValidationViewProps) {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(initialInvoice)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isComputing, setIsComputing] = useState(true)
  const [mappingData, setMappingData] = useState<any | null>(null)
  const { mode } = useDemoMode()

  // Re-run validation whenever invoice changes
  useEffect(() => {
    if (!currentInvoice) {
      setResult(null)
      setIsComputing(false)
      return
    }
    
    setIsComputing(true)
    setParseError(null)
    runValidation(contract, currentInvoice, initialGeneration).then((rawChecks) => {
      const checks = rawChecks.map((check) => ({
        ...check,
        explanation: check.verdict === 'MATCH' ? 'All amounts match contract terms.' :
          check.verdict === 'GAP' ? `Clause ${check.clause_reference}: contractual obligation not met. Review and issue corrective note.` :
          check.verdict === 'OPPORTUNITY' ? `Clause ${check.clause_reference}: earned entitlement not yet claimed. Issue supplementary invoice.` :
          'Insufficient data to validate this check.'
      }))
      try {
        const validated = ValidationResultSchema.parse({
          contract_id: contractId,
          invoice_id: currentInvoice.invoice_id,
          run_at: new Date().toISOString(),
          checks,
          total_gap_amount: checks.reduce((s, c) => s + (c.gap_amount ?? 0), 0),
          total_opportunity_amount: checks.reduce((s, c) => s + (c.opportunity_amount ?? 0), 0),
          verdict: checks.some(c => c.verdict === 'GAP') ? 'GAPS_FOUND' : checks.some(c => c.verdict === 'OPPORTUNITY') ? 'REVIEW_REQUIRED' : 'CLEAN',
        })
        setResult(validated)
      } catch (err) {
        console.error('Validation parse error:', err)
        setParseError('Unable to run validation — contract parameters may still be extracting.')
      }
    }).catch((err) => {
      console.error('runValidation failed:', err)
      setParseError('Validation engine error. Please refresh.')
    }).finally(() => setIsComputing(false))
  }, [contract, currentInvoice, initialGeneration, contractId])

  const handleFetchInvoice = async (file: File) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/invoices/extract', { method: 'POST', body: formData })
      
      const data = await res.json()
      
      // Clear legacy audit data before showing new result
      setResult(null)
      setParseError(null)
      
      if (res.status === 206) {
        // Mapping required
        setMappingData(data.partial_data)
        return
      }
      
      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed')
      }
      setCurrentInvoice(data)
      setShowUpload(false)
    } catch (err: any) {
      console.error(err)
      alert(`Failed to process invoice: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }


  return (
    <div className="space-y-12 pb-32 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <Link href={`/contracts/${contractId}`} className="text-[--color-wolvio-orange] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
          <ChevronLeft size={16} /> Back to Analysis
        </Link>
        <Button 
          variant="outline" 
          className="glass-button text-[--color-wolvio-light] px-6 py-4 rounded-xl border-white/10"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Cancel' : 'Upload Invoice PDF'}
        </Button>
      </div>

      {showUpload && (
        <div className="animate-in fade-in slide-in-from-top-6 duration-700">
          <InvoiceUpload onUpload={handleFetchInvoice} isProcessing={isProcessing} />
        </div>
      )}

      {/* Invoice Banner Card */}
      {currentInvoice ? (
        <div className="relative overflow-hidden glass rounded-[32px] border-none shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-[--color-wolvio-orange]/10 pointer-events-none" />
          <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-2">
              <div className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-[0.3em]">Billing Document</div>
              <h2 className="text-4xl font-heading font-black text-white tracking-tight">
                Invoice {currentInvoice.invoice_id}
              </h2>
              <div className="flex items-center gap-4 text-sm font-semibold text-[--color-wolvio-mid]">
                <span>{currentInvoice.period_start}</span>
                <ArrowRight size={14} className="opacity-30" />
                <span>{currentInvoice.period_end}</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 px-8 py-6 rounded-[24px] text-right">
              <div className="text-[10px] font-black text-[--color-wolvio-orange] uppercase tracking-[0.3em] mb-2">Invoice Amount</div>
              <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                ₹{currentInvoice.total.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-[32px] p-20 text-center border-dashed border-2 border-white/10">
          <div className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-[0.4em] mb-4">Awaiting Document</div>
          <h2 className="text-3xl font-heading font-black text-white/40">Ready for Audit</h2>
          <p className="text-sm text-[--color-wolvio-mid] mt-4">Upload a billing document to begin the deterministic audit.</p>
        </div>
      )}

      {/* Validation Result */}
      {isComputing ? (
        <div className="glass rounded-[32px] p-16 text-center space-y-6 border border-white/5">
          <div className="w-16 h-16 mx-auto bg-[--color-wolvio-orange]/10 rounded-2xl flex items-center justify-center border border-[--color-wolvio-orange]/20">
            <Loader2 className="text-[--color-wolvio-orange] animate-spin" size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight">Running Validation</h3>
            <p className="text-sm text-[--color-wolvio-mid] max-w-md mx-auto">Executing deterministic checks against contract terms…</p>
          </div>
        </div>
      ) : (parseError || !result) ? (
        <div className="glass rounded-[32px] p-16 text-center space-y-6 border border-amber-500/20">
          <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <span className="text-amber-400 text-3xl">⏳</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tight">Extraction In Progress</h3>
            <p className="text-sm text-amber-400/80 max-w-md mx-auto font-medium leading-relaxed">
              {parseError ?? 'Contract parameters are still being extracted. Please wait a moment and refresh.'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-[--color-wolvio-orange]/10 hover:bg-[--color-wolvio-orange]/20 border border-[--color-wolvio-orange]/30 rounded-full text-xs font-black uppercase tracking-widest text-[--color-wolvio-orange] transition-all"
          >
            Refresh Validation
          </button>
        </div>
      ) : (
        <div className="animate-fade-in-up animation-delay-200">
          <ValidationReport result={result} />
        </div>
      )}

      <InvoiceMappingModal 
        isOpen={!!mappingData}
        onClose={() => setMappingData(null)}
        rawInvoice={mappingData}
        onMappingComplete={(mapped) => {
          setCurrentInvoice(mapped)
          setShowUpload(false)
          setMappingData(null)
        }}
      />
    </div>
  )
}
