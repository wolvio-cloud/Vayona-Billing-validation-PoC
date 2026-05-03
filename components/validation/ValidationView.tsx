'use client'

import { useState } from 'react'
import { InvoiceUpload } from './InvoiceUpload'
import { ValidationReport } from './ValidationReport'
import { ContractParameters } from '@/lib/schemas/contract'
import { Invoice } from '@/lib/schemas/invoice'
import { runValidation, GenerationData } from '@/lib/validation/engine'
import { ValidationResultSchema } from '@/lib/schemas/validation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ValidationViewProps {
  contract: ContractParameters
  initialInvoice: Invoice
  initialGeneration?: GenerationData
  contractId: string
}

export function ValidationView({ contract, initialInvoice, initialGeneration, contractId }: ValidationViewProps) {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(initialInvoice)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const handleUpload = async (file: File) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/invoices/extract', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) throw new Error('Extraction failed')
      
      const data = await res.json()
      setCurrentInvoice(data)
      setShowUpload(false)
    } catch (err) {
      console.error(err)
      alert('Failed to process invoice. Ensure it is a valid digital PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Run validation logic
  const rawChecks = runValidation(contract, currentInvoice, initialGeneration)
  const checks = rawChecks.map((check) => ({
    ...check,
    explanation: check.verdict === 'MATCH' ? 'All amounts match contract terms.' : 
      check.verdict === 'GAP' ? `Clause ${check.clause_reference} requires WPI escalation. The invoice uses the pre-escalation rate.` :
      `Availability hit ${initialGeneration?.availability_pct}% — above the bonus threshold in ${check.clause_reference}.`
  }))

  const result = ValidationResultSchema.parse({
    contract_id: contractId,
    invoice_id: currentInvoice.invoice_id,
    run_at: new Date().toISOString(),
    checks,
    total_gap_amount: checks.reduce((s, c) => s + (c.gap_amount ?? 0), 0),
    total_opportunity_amount: checks.reduce((s, c) => s + (c.opportunity_amount ?? 0), 0),
    verdict: checks.some(c => c.verdict === 'GAP') ? 'GAPS_FOUND' : checks.some(c => c.verdict === 'OPPORTUNITY') ? 'REVIEW_REQUIRED' : 'CLEAN',
  })

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
          <InvoiceUpload onUpload={handleUpload} isProcessing={isProcessing} />
        </div>
      )}

      {/* Invoice Banner Card */}
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

      <div className="animate-fade-in-up animation-delay-200">
        <ValidationReport result={result} />
      </div>
    </div>
  )
}
