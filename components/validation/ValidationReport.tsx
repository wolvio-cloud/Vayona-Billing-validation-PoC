'use client'

import { useState, useEffect } from 'react'
import { ValidationLineItem } from './ValidationLineItem'
import { formatINR } from '@/lib/utils'
import type { ValidationResult } from '@/lib/schemas/validation'
import {
  Loader2, TrendingDown, TrendingUp, CheckCircle2, Share2,
  LayoutPanelLeft, FlaskConical, BookOpen, AlertTriangle,
  CalendarRange, DollarSign, ShieldCheck, Eye
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
  const [viewMode, setViewMode] = useState<'fc' | 'it'>('fc') // FC = plain language, IT = formulas

  const gaps = result.checks.filter((c) => c.verdict === 'GAP')
  const opportunities = result.checks.filter((c) => c.verdict === 'OPPORTUNITY')
  const matches = result.checks.filter((c) => c.verdict === 'MATCH')
  const totalRecoverable = result.total_gap_amount + result.total_opportunity_amount
  const annualRecoverable = totalRecoverable * 12

  useEffect(() => {
    setIsAnalyzing(true)
    setShowTotals(false)
    setGapCount(0)
    const t1 = setTimeout(() => setIsAnalyzing(false), 1200)
    const t2 = setTimeout(() => setShowTotals(true), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [result])

  useEffect(() => {
    if (showTotals && result.total_gap_amount > 0) {
      let startTimestamp: number | null = null
      const duration = 800
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 5)
        setGapCount(Math.floor(ease * result.total_gap_amount))
        if (progress < 1) window.requestAnimationFrame(step)
        else setGapCount(result.total_gap_amount)
      }
      window.requestAnimationFrame(step)
    }
  }, [showTotals, result.total_gap_amount])

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-wolvio-orange animate-spin opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-wolvio-orange rounded-full animate-pulse shadow-[0_0_20px_rgba(242,102,48,0.5)]" />
          </div>
        </div>
        <div className="text-2xl font-heading font-black text-white tracking-tight animate-pulse uppercase">Determining Variances...</div>
      </div>
    )
  }

  return (
    <div className="space-y-10">

      {/* ── FC / IT Toggle ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black text-wolvio-mid uppercase tracking-[0.4em]">Validation Report — {result.invoice_id}</div>
        <div className="flex items-center gap-2 glass rounded-full p-1 border border-white/10">
          <button
            onClick={() => setViewMode('fc')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'fc' ? 'bg-wolvio-orange text-white shadow-md' : 'text-wolvio-mid hover:text-white'}`}
          >
            <DollarSign size={12} className="inline mr-1" />FC View
          </button>
          <button
            onClick={() => setViewMode('it')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'it' ? 'bg-blue-500 text-white shadow-md' : 'text-wolvio-mid hover:text-white'}`}
          >
            <FlaskConical size={12} className="inline mr-1" />IT View
          </button>
        </div>
      </div>

      {/* ── FC View: Business impact first ───────────────────── */}
      {viewMode === 'fc' && (
        <div className="glass rounded-[28px] p-8 border border-wolvio-orange/20 bg-gradient-to-br from-wolvio-orange/5 via-transparent to-transparent">
          <div className="text-[10px] font-black text-wolvio-orange uppercase tracking-[0.3em] mb-4">2-Minute Summary for Finance Controller</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-[9px] font-black text-wolvio-mid uppercase tracking-widest">This Invoice: Gap</div>
              <div className="text-3xl font-mono font-black text-red-400">{formatCr(result.total_gap_amount)}</div>
              <div className="text-[10px] text-red-400/60 font-medium">Under/over-billed amounts found</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-black text-wolvio-mid uppercase tracking-widest">Unclaimed Upside</div>
              <div className="text-3xl font-mono font-black text-amber-400">{formatCr(result.total_opportunity_amount)}</div>
              <div className="text-[10px] text-amber-400/60 font-medium">Entitlements not yet invoiced</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-black text-wolvio-mid uppercase tracking-widest">Annual Run-Rate Risk</div>
              <div className="text-3xl font-mono font-black text-wolvio-orange">{formatCr(annualRecoverable)}</div>
              <div className="text-[10px] text-wolvio-orange/60 font-medium">If this pattern repeats monthly</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-[9px] font-black text-wolvio-mid uppercase tracking-widest mb-3">Actions Required</div>
            <div className="flex flex-wrap gap-3">
              {gaps.map(g => (
                <div key={g.check_id} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-400">
                  <AlertTriangle size={10} />Raise corrective note — {g.check_name}
                </div>
              ))}
              {opportunities.map(o => (
                <div key={o.check_id} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-400">
                  <TrendingUp size={10} />Issue supplementary invoice — {o.check_name}
                </div>
              ))}
              {gaps.length === 0 && opportunities.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400">
                  <CheckCircle2 size={10} />Invoice is clean — approve for payment
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── IT View: Formula + logic path ────────────────────── */}
      {viewMode === 'it' && (
        <div className="glass rounded-[28px] p-8 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Technical Audit Trail — IT Review</div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-[9px] font-black text-wolvio-mid uppercase tracking-widest mb-1">Checks Run</div>
                <div className="text-2xl font-mono font-black text-white">{result.checks.length}</div>
              </div>
              <div className="glass rounded-2xl p-4 border border-red-500/20">
                <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Gaps</div>
                <div className="text-2xl font-mono font-black text-red-400">{gaps.length}</div>
              </div>
              <div className="glass rounded-2xl p-4 border border-amber-500/20">
                <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Opportunities</div>
                <div className="text-2xl font-mono font-black text-amber-400">{opportunities.length}</div>
              </div>
              <div className="glass rounded-2xl p-4 border border-green-500/20">
                <div className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Matches</div>
                <div className="text-2xl font-mono font-black text-green-400">{matches.length}</div>
              </div>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5">
              <div className="text-[9px] font-black text-wolvio-mid uppercase tracking-widest mb-2">Run Metadata</div>
              <div className="font-mono text-[10px] text-white/60 space-y-1">
                <div>run_at: {result.run_at}</div>
                <div>contract_id: {result.contract_id}</div>
                <div>invoice_id: {result.invoice_id}</div>
                <div>verdict: {result.verdict}</div>
                <div>engine: deterministic_v2 (no LLM for numeric decisions)</div>
                <div>wpi_source: OEA GoI / cached Jan-2025 snapshot</div>
              </div>
            </div>
            <div className="flex items-start gap-2 px-4 py-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <Eye size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-400/80 font-medium">Click any finding below to see the exact formula, source clause, page number, and raw text snippet that produced this result. Zero hallucination — every number is traceable.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-12 lg:gap-20 items-start overflow-visible relative">

        {/* Executive Summary Panel */}
        <div className="lg:sticky lg:top-32 space-y-8 animate-fade-in-up z-10 lg:w-[400px]">
          <div className="glass rounded-[40px] p-10 border border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] bg-[#030A14]/98 backdrop-blur-3xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-wolvio-orange to-transparent opacity-40" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-wolvio-mid mb-10">Executive Audit</h2>
            <div className="mb-10 w-full">
              <div className={`font-mono text-5xl font-black tracking-tighter transition-all duration-700 ${showTotals ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${result.total_gap_amount > 0 ? 'text-wolvio-red' : 'text-wolvio-green'}`}>
                {formatINR(gapCount)}
              </div>
              <div className={`text-xs font-bold mt-3 tracking-widest uppercase transition-all duration-700 delay-200 ${showTotals ? 'opacity-100' : 'opacity-0'} ${result.total_gap_amount > 0 ? 'text-wolvio-red' : 'text-wolvio-green'}`}>
                {result.total_gap_amount > 0 ? 'Leakage Identified' : 'Revenue Secured'}
              </div>
            </div>
            <div className={`w-full space-y-4 transition-all duration-700 delay-400 ${showTotals ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-between px-6 py-4 glass rounded-2xl border-white/5">
                <div className="flex items-center gap-3"><TrendingDown size={16} className="text-wolvio-red" /><span className="text-sm font-bold text-white/80">Gaps</span></div>
                <span className="font-mono font-black text-wolvio-red">{gaps.length}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 glass rounded-2xl border-white/5">
                <div className="flex items-center gap-3"><TrendingUp size={16} className="text-wolvio-amber" /><span className="text-sm font-bold text-white/80">Upside</span></div>
                <span className="font-mono font-black text-wolvio-amber">{opportunities.length}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 glass rounded-2xl border-white/5">
                <div className="flex items-center gap-3"><CheckCircle2 size={16} className="text-wolvio-green" /><span className="text-sm font-bold text-white/80">Matches</span></div>
                <span className="font-mono font-black text-wolvio-green">{matches.length}</span>
              </div>
            </div>
          </div>

          {/* Recovery Forecast Widget */}
          {totalRecoverable > 0 && (
            <div className="glass rounded-[32px] p-8 border border-wolvio-amber/20 bg-wolvio-amber/5 space-y-6">
              <div className="flex items-center gap-3">
                <CalendarRange size={16} className="text-wolvio-amber" />
                <div className="text-[10px] font-black text-wolvio-amber uppercase tracking-[0.4em]">Leakage Forecast</div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest">If this gap continues:</div>
                  <div className="text-3xl font-mono font-black text-wolvio-amber tracking-tighter">
                    {formatCr(annualRecoverable)} <span className="text-xs">per year</span>
                  </div>
                </div>
                <div className="text-[10px] text-wolvio-mid/50 font-medium leading-relaxed italic">
                  *Based on a 12-month extrapolation of current monthly variances.
                </div>
              </div>
            </div>
          )}

          {/* Assumptions Panel */}
          <div className="glass rounded-[24px] p-5 border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={12} className="text-wolvio-mid" />
              <div className="text-[9px] font-black text-wolvio-mid uppercase tracking-widest">Assumptions Used</div>
            </div>
            <div className="space-y-2 text-[10px] text-white/40 font-medium leading-relaxed">
              <p>• WPI Jan-2025: 161.5 (OEA GoI cached snapshot)</p>
              <p>• WPI Jan-2024: 155.0 (OEA GoI cached snapshot)</p>
              <p>• Late interest rate: SBI Base Rate + 2% ≈ 15% p.a.</p>
              <p>• All amounts ex-GST unless stated otherwise</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full py-8 glass-button text-white font-black text-xs uppercase tracking-widest rounded-2xl border-white/10"
              onClick={() => setShowAggregate(!showAggregate)}
            >
              <LayoutPanelLeft className="w-4 h-4 mr-3" /> Multi-Month Analysis
            </Button>
            <Button
              className="w-full py-8 bg-wolvio-orange hover:bg-[#d95a2b] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_15px_40px_-10px_rgba(242,102,48,0.4)] group"
              onClick={() => {
                const html = generateShareReportHtml(result, showAggregate, {
                  contract_name: contractName || 'Contract Agreement',
                  counterparty: counterparty || 'Provider',
                  invoice_id: result.invoice_id
                })
                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = `Wolvio_Report_${result.invoice_id}.html`
                document.body.appendChild(a); a.click(); document.body.removeChild(a)
              }}
            >
              <Share2 className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" /> Export Audit Report
            </Button>
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-6 overflow-visible">
          <div className="flex items-center gap-4 mb-8">
            <ShieldCheck size={16} className="text-wolvio-mid" />
            <h3 className="text-[10px] font-black text-wolvio-mid uppercase tracking-[0.5em]">Line Item Variance Analysis</h3>
            <div className="flex-1 h-[1px] bg-white/5" />
            {viewMode === 'it' && (
              <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest px-2 py-1 bg-blue-500/10 rounded-full">
                Click findings for formula proof
              </div>
            )}
          </div>
          {result.checks.map((check) => (
            <div key={check.check_id} className="animate-fade-in-up">
              <ValidationLineItem check={check} showFormula={viewMode === 'it'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
