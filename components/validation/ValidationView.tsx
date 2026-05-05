'use client'

import { useState, useEffect } from 'react'
import { InvoiceUpload } from './InvoiceUpload'
import { ValidationReport } from './ValidationReport'
import { ContractParameters } from '@/lib/schemas/contract'
import { Invoice } from '@/lib/schemas/invoice'
import { runValidation, GenerationData } from '@/lib/validation/engine'
import { ValidationResultSchema, ValidationResult } from '@/lib/schemas/validation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { InvoiceMappingModal } from './InvoiceMappingModal'
import { useDemoMode } from '@/components/DemoModeBadge'
import { InvoiceSelector } from './InvoiceSelector'

interface ValidationViewProps {
  contract: ContractParameters
  initialInvoice: Invoice | null
  initialGeneration?: GenerationData
  contractId: string
  contractDisplayName?: string
  allInvoices?: string[]
}

export function ValidationView({ 
  contract, 
  initialInvoice, 
  initialGeneration, 
  contractId, 
  contractDisplayName,
  allInvoices = []
}: ValidationViewProps) {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(initialInvoice)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isComputing, setIsComputing] = useState(true)
  const [mappingData, setMappingData] = useState<any | null>(null)
  const { mode } = useDemoMode()
  const router = useRouter()

  useEffect(() => {
    setCurrentInvoice(initialInvoice)
  }, [initialInvoice])

  useEffect(() => {
    if (!currentInvoice || !currentInvoice.invoice_id) {
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
      formData.append('contract_id', contractId)
      const res = await fetch('/api/invoices/extract', { method: 'POST', body: formData })
      const data = await res.json()
      console.log('[ValidationView] Extraction result:', data)
      setResult(null)
      setParseError(null)
      if (res.status === 206) {
        console.warn('[ValidationView] Partial data returned, opening mapping workbench')
        setMappingData(data.partial_data)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Extraction failed')
      setCurrentInvoice(data)
      setShowUpload(false)
      // Refresh the server-side invoice list
      router.refresh()
      // Smooth scroll to validation content
      setTimeout(() => {
        document.getElementById('validation-content')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      console.error(err)
      alert(`Failed to process invoice: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-12 pb-32 animate-fade-in-up">
      {allInvoices.length > 0 && (
        <div className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md py-4 -mx-6 px-6 border-b border-slate-200">
          <InvoiceSelector 
            contractId={contractId} 
            allInvoices={allInvoices} 
            currentInvoiceId={currentInvoice?.invoice_id || ''} 
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href={`/contracts/${contractId}`} className="text-wolvio-orange text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
          <ChevronLeft size={16} /> Back to Analysis
        </Link>
        <Button 
          variant="outline" 
          className="bg-white px-6 py-4 rounded-xl border-slate-200 text-slate-900 shadow-sm"
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

      <div id="validation-content" className="scroll-mt-32">
        {currentInvoice ? (
          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Billing Document</div>
                <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">
                  Invoice {currentInvoice.invoice_id}
                </h2>
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                  <span>{currentInvoice.period_start}</span>
                  <ArrowRight size={14} className="opacity-30" />
                  <span>{currentInvoice.period_end}</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl text-right">
                <div className="text-[10px] font-black text-wolvio-orange uppercase tracking-[0.2em] mb-1">Invoice Amount</div>
                <div className="text-3xl font-mono font-bold text-slate-900">
                  ₹{currentInvoice.total.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-slate-200">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Awaiting Document</div>
            <h2 className="text-2xl font-heading font-black text-slate-400">Ready for Audit</h2>
            <p className="text-sm text-slate-500 mt-4">Upload a billing document to begin the deterministic audit.</p>
          </div>
        )}

        {isComputing ? (
          <div className="bg-white rounded-2xl p-12 text-center space-y-4 border border-slate-200 mt-8 shadow-sm">
            <div className="w-12 h-12 mx-auto bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
              <Loader2 className="text-wolvio-orange animate-spin" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-heading font-black text-slate-900 uppercase">Running Validation</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">Executing deterministic checks against contract terms…</p>
            </div>
          </div>
        ) : (parseError || !result) ? (
          <div className="bg-white rounded-2xl p-12 text-center space-y-4 border border-amber-200 mt-8 shadow-sm">
            <div className="w-12 h-12 mx-auto bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
              <span className="text-amber-600 text-2xl">⏳</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-heading font-black text-slate-900 uppercase">Extraction In Progress</h3>
              <p className="text-sm text-amber-600 max-w-md mx-auto font-medium leading-relaxed">
                {parseError ?? 'Contract parameters are still being extracted. Please wait a moment and refresh.'}
              </p>
            </div>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full text-xs font-black uppercase tracking-widest text-wolvio-orange transition-all">
              Refresh Validation
            </button>
          </div>
        ) : (
          <div className="animate-fade-in-up animation-delay-200 mt-12">
            <ValidationReport result={result} contractName={contractDisplayName} />
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
    </div>
  )
}
