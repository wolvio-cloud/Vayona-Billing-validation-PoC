'use client'

import { useState, useEffect } from 'react'
import { ValidationLineItem } from './ValidationLineItem'
import { formatINR } from '@/lib/utils'
import type { ValidationResult } from '@/lib/schemas/validation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateShareReportHtml } from './generateReport'

interface ValidationReportProps {
  result: ValidationResult
}

export function ValidationReport({ result }: ValidationReportProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [showTotals, setShowTotals] = useState(false)
  const [gapCount, setGapCount] = useState(0)
  const [showAggregate, setShowAggregate] = useState(false)

  const gaps = result.checks.filter((c) => c.verdict === 'GAP')
  const opportunities = result.checks.filter((c) => c.verdict === 'OPPORTUNITY')
  const matches = result.checks.filter((c) => c.verdict === 'MATCH')

  useEffect(() => {
    setIsAnalyzing(true)
    setShowTotals(false)
    setGapCount(0)

    const t1 = setTimeout(() => setIsAnalyzing(false), 1500)
    const t2 = setTimeout(() => setShowTotals(true), 1500 + result.checks.length * 50 + 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [result])

  useEffect(() => {
    if (showTotals && result.total_gap_amount > 0) {
      let startTimestamp: number | null = null
      const duration = 600
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 4)
        setGapCount(Math.floor(ease * result.total_gap_amount))
        if (progress < 1) {
          window.requestAnimationFrame(step)
        } else {
          setGapCount(result.total_gap_amount)
        }
      }
      window.requestAnimationFrame(step)
    } else if (showTotals && result.total_gap_amount === 0) {
      setGapCount(0)
    }
  }, [showTotals, result.total_gap_amount])

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 text-[--color-wolvio-orange] animate-spin" />
        <div className="text-lg font-heading font-semibold text-[--color-wolvio-light] animate-pulse">Running deterministic validation model...</div>
      </div>
    )
  }

  if (showAggregate) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* PATTERN ANALYSIS SECTION */}
        <div className="bg-[#112A46] rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#F59E0B]/30 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F59E0B]" />
          <div className="px-6 py-4 border-b border-[#F59E0B]/20 bg-[#F59E0B]/5 flex items-center gap-3">
            <h3 className="font-heading font-bold text-[#F59E0B] tracking-wider uppercase text-sm">Pattern Analysis</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between border-b border-[--color-wolvio-slate] pb-2">
                <span className="font-mono text-[--color-wolvio-light] font-semibold">WPI Escalation</span>
                <span className="text-[#EF4444] font-medium text-sm flex items-center gap-2">Missing in 3 of 6 invoices <span className="w-2 h-2 rounded-full bg-[#EF4444]" /></span>
              </div>
              <div className="flex items-center justify-between border-b border-[--color-wolvio-slate] pb-2">
                <span className="font-mono text-[--color-wolvio-light] font-semibold">Variable Charge</span>
                <span className="text-[#EF4444] font-medium text-sm flex items-center gap-2">Missing in 2 of 6 invoices <span className="w-2 h-2 rounded-full bg-[#EF4444]" /></span>
              </div>
              <div className="flex items-center justify-between border-b border-[--color-wolvio-slate] pb-2">
                <span className="font-mono text-[--color-wolvio-light] font-semibold">Base Fee</span>
                <span className="text-[#22C55E] font-medium text-sm flex items-center gap-2">Correct in 6 of 6 invoices <span className="w-2 h-2 rounded-full bg-[#22C55E]" /></span>
              </div>
              <div className="flex items-center justify-between border-b border-[--color-wolvio-slate] pb-2">
                <span className="font-mono text-[--color-wolvio-light] font-semibold">Performance Bonus</span>
                <span className="text-[#F59E0B] font-medium text-sm flex items-center gap-2">Claimable in 1 of 6 <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /></span>
              </div>
            </div>
            
            <div className="p-4 bg-[--color-wolvio-dark] rounded-lg border border-[--color-wolvio-slate]">
              <p className="text-[15px] font-semibold text-[--color-wolvio-light] leading-relaxed">
                This is a <span className="text-[#F59E0B]">systematic billing process gap</span>, not a one-off error.
              </p>
            </div>
          </div>
        </div>

        {/* INVOICE TABLE */}
        <div className="bg-[--color-wolvio-surface] rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[--color-wolvio-slate] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[--color-wolvio-navy] border-b border-[--color-wolvio-slate]">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-mid]">Invoice</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-mid]">Period</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-mid]">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-mid] text-right">Gap</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-mid] text-right">Opportunity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-wolvio-slate]">
            <tr className="hover:bg-[--color-wolvio-navy]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-light]">INV-001</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-mid]">Mar 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/20 text-[#22C55E] border border-green-500/30">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
            </tr>
            <tr className="bg-red-500/5 hover:bg-red-500/10">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-light]">INV-002</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-mid]">Apr 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-[#EF4444] border border-red-500/30">GAP FOUND</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm font-bold text-[#EF4444]">{formatINR(347484)}</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
            </tr>
            <tr className="hover:bg-[--color-wolvio-navy]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-light]">INV-003</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-mid]">May 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/20 text-[#22C55E] border border-green-500/30">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
            </tr>
            <tr className="bg-amber-500/5 hover:bg-amber-500/10">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-light]">INV-004</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-mid]">Jun 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-[#F59E0B] border border-amber-500/30">OPPORTUNITY</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm font-bold text-[#F59E0B]">{formatINR(576000)}</td>
            </tr>
            <tr className="hover:bg-[--color-wolvio-navy]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-light]">INV-005</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-mid]">Jul 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/20 text-[#22C55E] border border-green-500/30">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
            </tr>
            <tr className="hover:bg-[--color-wolvio-navy]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-light]">INV-006</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-mid]">Aug 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/20 text-[#22C55E] border border-green-500/30">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-mid]">-</td>
            </tr>
            <tr className="bg-[--color-wolvio-navy] text-[--color-wolvio-light]">
              <td colSpan={3} className="px-6 py-4 font-heading font-bold text-right uppercase tracking-wider text-sm">Portfolio Totals</td>
              <td className="px-6 py-4 text-right font-mono text-lg font-bold text-[#EF4444]">{formatINR(347484)}</td>
              <td className="px-6 py-4 text-right font-mono text-lg font-bold text-[#F59E0B]">{formatINR(576000)}</td>
            </tr>
          </tbody>
        </table>
        <div className="p-4 bg-[--color-wolvio-surface] border-t border-[--color-wolvio-slate] flex justify-end">
          <Button variant="outline" className="border-[--color-wolvio-slate] text-[--color-wolvio-light] bg-transparent hover:bg-[--color-wolvio-navy] font-semibold">Export CSV</Button>
        </div>
      </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8 items-start">
      {/* Summary panel (sticky) */}
      <div className="sticky top-6 space-y-6">
        <div className="bg-[--color-wolvio-surface] rounded-[12px] border border-[--color-wolvio-slate] shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-6 flex flex-col items-center text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[--color-wolvio-mid] mb-6">Validation Summary</h2>
          
          <div className="mb-8 w-full">
            <div className={`font-mono text-4xl font-extrabold tracking-tight transition-opacity duration-500 ${showTotals ? 'opacity-100' : 'opacity-0'} ${result.total_gap_amount > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {showTotals && gapCount > 0 ? formatINR(gapCount) : showTotals && result.total_gap_amount === 0 ? '₹0' : '₹0'}
            </div>
            <div className={`text-sm font-medium mt-1 transition-opacity duration-500 delay-150 ${showTotals ? 'opacity-100' : 'opacity-0'} ${result.total_gap_amount > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {result.total_gap_amount > 0 ? 'Total Value at Risk' : 'No Gaps Found'}
            </div>
          </div>
          
          <div className={`w-full space-y-3 transition-opacity duration-500 delay-300 ${showTotals ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="font-semibold text-sm text-[#EF4444]">{gaps.length} gap{gaps.length !== 1 && 's'} found</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <span className="font-semibold text-sm text-[#F59E0B]">{opportunities.length} opportunit{opportunities.length === 1 ? 'y' : 'ies'}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <span className="font-semibold text-sm text-[#22C55E]">{matches.length} matches</span>
            </div>
          </div>

          <div className={`mt-6 w-full transition-opacity duration-500 delay-500 ${showTotals ? 'opacity-100' : 'opacity-0'}`}>
            {result.total_gap_amount > 0 ? (
              <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 text-[#EF4444] text-xs font-bold uppercase tracking-wider rounded-full">High Severity</div>
            ) : result.total_opportunity_amount > 0 ? (
              <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-[#F59E0B] text-xs font-bold uppercase tracking-wider rounded-full">Medium Severity</div>
            ) : (
              <div className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/30 text-[#22C55E] text-xs font-bold uppercase tracking-wider rounded-full">Low Severity</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            className="w-full py-6 border-2 border-[--color-wolvio-slate] bg-transparent text-[--color-wolvio-light] font-bold text-sm hover:bg-[--color-wolvio-surface] hover:text-white"
            onClick={() => setShowAggregate(true)}
          >
            Run All 6 Invoices
          </Button>

          <Button 
            variant="outline" 
            className="w-full py-6 border-2 border-[--color-wolvio-orange] bg-[--color-wolvio-orange] text-white font-bold text-sm hover:bg-[#d95a2b] hover:border-[#d95a2b] shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
            onClick={() => {
              const html = generateShareReportHtml(result, showAggregate)
              const blob = new Blob([html], { type: 'text/html' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `Wolvio_Findings_Report_${new Date().toISOString().split('T')[0]}.html`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
          >
            Share Report (Offline)
          </Button>
        </div>
      </div>

      {/* Findings panel */}
      <div className="space-y-4">
        {result.checks.map((check, idx) => (
          <div 
            key={check.check_id}
            className="animate-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDelay: `${idx * 50}ms`, animationDuration: '300ms' }}
          >
            <ValidationLineItem check={check} />
          </div>
        ))}
      </div>
    </div>
  )
}
