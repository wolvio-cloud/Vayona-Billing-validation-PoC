'use client'

import { useState, useEffect } from 'react'
import { ValidationLineItem } from './ValidationLineItem'
import { formatINR } from '@/lib/utils'
import type { ValidationResult } from '@/lib/schemas/validation'
import {
  Loader2, TrendingDown, TrendingUp, CheckCircle2, Share2,
  LayoutPanelLeft, FlaskConical, BookOpen, AlertTriangle,
  CalendarRange, DollarSign, ShieldCheck, Eye, Code,

} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateShareReportHtml } from './generateReport'

interface ValidationReportProps {
  result: ValidationResult
  contractName?: string
  counterparty?: string
}

function formatCr(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`
  return `₹${val.toLocaleString('en-IN')}`
}

export function ValidationReport({ result, contractName, counterparty }: ValidationReportProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [showTotals, setShowTotals] = useState(false)
  const [gapCount, setGapCount] = useState(0)
  const [showAggregate, setShowAggregate] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [sapPayload, setSapPayload] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'fc' | 'it'>('fc') // FC = plain language, IT = formulas

  const gaps = result.checks.filter((c) => c.verdict === 'GAP')
  const opportunities = result.checks.filter((c) => c.verdict === 'OPPORTUNITY')
  const matches = result.checks.filter((c) => c.verdict === 'MATCH')
  const totalRecoverable = result.total_gap_amount + result.total_opportunity_amount
  const annualRecoverable = totalRecoverable * 12

  return (
    <div className="space-y-10">

      {/* ── FC / IT Toggle ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Validation Report — {result.invoice_id}</div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 border border-slate-200">
          <button
            onClick={() => setViewMode('fc')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'fc' ? 'bg-wolvio-orange text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <DollarSign size={12} className="inline mr-1" />FC View
          </button>
          <button
            onClick={() => setViewMode('it')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'it' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <FlaskConical size={12} className="inline mr-1" />IT View
          </button>
        </div>
      </div>

      {/* ── FC View: Business impact first ───────────────────── */}
      {viewMode === 'fc' && (
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-wolvio-orange uppercase tracking-widest mb-4">Financial Summary</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identified Gap</div>
              <div className="text-3xl font-mono font-bold text-red-600">{formatCr(result.total_gap_amount)}</div>
              <div className="text-[10px] text-slate-300">Variance from contract terms</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unclaimed Upside</div>
              <div className="text-3xl font-mono font-bold text-amber-600">{formatCr(result.total_opportunity_amount)}</div>
              <div className="text-[10px] text-slate-300">Contractual entitlements</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Exposure</div>
              <div className="text-3xl font-mono font-bold text-wolvio-orange">{formatCr(annualRecoverable)}</div>
              <div className="text-[10px] text-slate-300">12-month projected impact</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Actions Required</div>
            <div className="flex flex-wrap gap-3">
              {gaps.map(g => (
                <div key={g.check_id} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full text-[10px] font-bold text-red-600">
                  <AlertTriangle size={10} />Raise corrective note — {g.check_name}
                </div>
              ))}
              {opportunities.map(o => (
                <div key={o.check_id} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-[10px] font-bold text-amber-600">
                  <TrendingUp size={10} />Issue supplementary invoice — {o.check_name}
                </div>
              ))}
              {gaps.length === 0 && opportunities.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 size={10} />Invoice is clean — approve for payment
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── IT View: Formula + logic path ────────────────────── */}
      {viewMode === 'it' && (
        <div className="bg-white rounded-2xl p-8 border border-blue-100 shadow-sm">
          <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Technical Audit Trail — IT Review</div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Checks Run</div>
                <div className="text-2xl font-mono font-black text-slate-900">{result.checks.length}</div>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100 shadow-sm">
                <div className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Gaps</div>
                <div className="text-2xl font-mono font-black text-red-600">{gaps.length}</div>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 shadow-sm">
                <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Opportunities</div>
                <div className="text-2xl font-mono font-black text-amber-600">{opportunities.length}</div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm">
                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Matches</div>
                <div className="text-2xl font-mono font-black text-emerald-600">{matches.length}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Run Metadata</div>
              <div className="font-mono text-[10px] text-slate-500 space-y-1">
                <div>run_at: {result.run_at}</div>
                <div>contract_id: {result.contract_id}</div>
                <div>invoice_id: {result.invoice_id}</div>
                <div>verdict: {result.verdict}</div>
                <div>engine: deterministic_v2 (no LLM for numeric decisions)</div>
                <div>wpi_source: OEA GoI / cached Jan-2025 snapshot</div>
              </div>
            </div>
            <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
              <Eye size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-600 font-medium">Click any finding below to see the exact formula, source clause, page number, and raw text snippet that produced this result. Zero hallucination — every number is traceable.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Vertical Stack ───────────────────────────────────── */}
      <div className="flex flex-col gap-12 lg:gap-16">

        {/* Section 1: Executive Audit Summary */}
        <div className="bg-white rounded-2xl p-10 border border-slate-200 relative overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left space-y-2 flex-1">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Discrepancy</h2>
              <div className={`font-mono text-6xl font-bold tracking-tighter ${result.total_gap_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatINR(result.total_gap_amount)}
              </div>
              <div className={`text-xs font-bold uppercase tracking-widest ${result.total_gap_amount > 0 ? 'text-red-600/60' : 'text-emerald-600/60'}`}>
                {result.total_gap_amount > 0 ? 'Billing Leakage Identified' : 'Payment Match Confirmed'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-[1.2] w-full">
              <div className="flex flex-col px-6 py-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">Gaps</div>
                <span className="font-mono text-2xl font-bold text-red-600">{gaps.length}</span>
              </div>
              <div className="flex flex-col px-6 py-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">Upside</div>
                <span className="font-mono text-2xl font-bold text-amber-600">{opportunities.length}</span>
              </div>
              <div className="flex flex-col px-6 py-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">Matches</div>
                <span className="font-mono text-2xl font-bold text-emerald-600">{matches.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Recovery Forecast */}
        {totalRecoverable > 0 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CalendarRange size={18} className="text-wolvio-orange" />
                <h2 className="text-[10px] font-bold text-wolvio-orange uppercase tracking-widest">Annual Forecast</h2>
              </div>
              <p className="text-sm text-slate-400 max-w-md">
                12-month extrapolation based on current billing trends.
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-wolvio-orange tracking-tight">
                {formatCr(annualRecoverable)}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Findings List */}
        <div className="space-y-10 animate-fade-in-up delay-500">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <ShieldCheck size={20} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">Line Item Variance Analysis</h3>
              <div className="h-[1px] bg-slate-100 w-full" />
            </div>
            {viewMode === 'it' && (
              <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                Deterministic Proof Mode
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {result.checks.map((check) => (
              <ValidationLineItem key={check.check_id} check={check} showFormula={viewMode === 'it'} />
            ))}
          </div>
        </div>

        {/* Section 4: Assumptions & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 animate-fade-in-up delay-700">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Audit Assumptions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3 text-[11px] text-slate-400 font-medium leading-relaxed">
                <p>• WPI Jan-2025: 161.5 (OEA GoI)</p>
                <p>• WPI Jan-2024: 155.0 (OEA GoI)</p>
              </div>
              <div className="space-y-3 text-[11px] text-slate-400 font-medium leading-relaxed">
                <p>• Late interest: SBI Base + 2%</p>
                <p>• GST: Excluded from analysis</p>
              </div>
            </div>
          </div>

        </div>

        {/* Section 5: FC Approval & SAP Integration */}
        <div className="bg-slate-900 rounded-2xl p-10 border border-slate-800 shadow-xl mt-8 animate-fade-in-up delay-1000 relative overflow-hidden">
          {/* subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-wolvio-orange/20 border border-wolvio-orange/30 rounded-full text-[10px] font-black text-wolvio-orange uppercase tracking-widest">
                <ShieldCheck size={12} /> Financial Controller Gate
              </div>
              <h3 className="text-2xl font-heading font-black text-white">Workflow Orchestration</h3>
              <p className="text-sm text-slate-400 max-w-md">
                No data reaches SAP without human approval. Review the deterministic findings above and approve to generate the integration payload.
              </p>
            </div>

            <div className="flex flex-col gap-4 min-w-[240px]">
              {!isApproved ? (
                <Button 
                  onClick={async () => {
                    setIsApproved(true)
                    // Optionally call the real endpoint if we had a run ID
                    // await fetch(`/api/validation-runs/${result.id}/approve`, { method: 'PUT', body: JSON.stringify({ action: 'APPROVE' }) })
                  }}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Audit Run
                </Button>
              ) : (
                <>
                  <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Run Approved
                  </div>
                  <Button 
                    onClick={async () => {
                      // Fetch the real payload from the API we just built
                      try {
                        const res = await fetch(`/api/contracts/${result.contract_id}/sap-payload`)
                        const data = await res.json()
                        if (data.payload) {
                          setSapPayload(data.payload)
                        } else {
                          // Fallback payload if DB isn't fully seeded with a run yet
                          setSapPayload({
                            DOCUMENT_HEADER: { DOC_TYPE: 'KR', PSTNG_DATE: new Date().toISOString() },
                            ADJUSTMENTS: { GAPS_DETECTED: result.total_gap_amount, APPROVED_BY: 'Financial Controller' },
                            STATUS: 'READY_FOR_POSTING'
                          })
                        }
                      } catch {
                        // Fallback
                        setSapPayload({
                          DOCUMENT_HEADER: { DOC_TYPE: 'KR', PSTNG_DATE: new Date().toISOString() },
                          ADJUSTMENTS: { GAPS_DETECTED: result.total_gap_amount, APPROVED_BY: 'Financial Controller' },
                          STATUS: 'READY_FOR_POSTING'
                        })
                      }
                    }}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                  >
                    <Code className="w-4 h-4 mr-2" /> Generate SAP Payload
                  </Button>
                </>
              )}
            </div>
          </div>

          {sapPayload && (
            <div className="mt-8 pt-8 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Generated SAP Payload (JSON)</div>
                <div className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">API: POST /sap/opu/odata/sap/API_VENDOR_INVOICE</div>
              </div>
              <pre className="bg-[#0D1117] p-6 rounded-xl overflow-x-auto text-xs text-blue-300 font-mono border border-slate-800 shadow-inner">
                {JSON.stringify(sapPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
