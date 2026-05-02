'use client'

import { useState, useEffect } from 'react'
import { ValidationLineItem } from './ValidationLineItem'
import { formatINR } from '@/lib/utils'
import type { ValidationResult } from '@/lib/schemas/validation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <div className="text-lg font-heading font-semibold text-[--color-wolvio-navy] animate-pulse">Running deterministic validation model...</div>
      </div>
    )
  }

  if (showAggregate) {
    return (
      <div className="bg-white rounded-[12px] shadow-[0_2px_8px_rgba(10,35,66,0.08)] border border-[--color-wolvio-light] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[--color-wolvio-off] border-b border-[--color-wolvio-light]">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate]">Invoice</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate]">Period</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate]">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate] text-right">Gap</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate] text-right">Opportunity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-wolvio-light]">
            <tr className="hover:bg-[#FAFBFC]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-navy]">INV-001</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-slate]">Mar 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-[#10B981]">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
            </tr>
            <tr className="hover:bg-[#FAFBFC] bg-red-50/30">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-navy]">INV-002</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-slate]">Apr 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-[#DC2626]">GAP FOUND</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm font-bold text-[#DC2626]">{formatINR(347484)}</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
            </tr>
            <tr className="hover:bg-[#FAFBFC]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-navy]">INV-003</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-slate]">May 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-[#10B981]">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
            </tr>
            <tr className="hover:bg-[#FAFBFC] bg-amber-50/30">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-navy]">INV-004</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-slate]">Jun 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-[#F59E0B]">OPPORTUNITY</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm font-bold text-[#F59E0B]">{formatINR(576000)}</td>
            </tr>
            <tr className="hover:bg-[#FAFBFC]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-navy]">INV-005</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-slate]">Jul 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-[#10B981]">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
            </tr>
            <tr className="hover:bg-[#FAFBFC]">
              <td className="px-6 py-4 font-mono font-medium text-[--color-wolvio-navy]">INV-006</td>
              <td className="px-6 py-4 text-sm text-[--color-wolvio-slate]">Aug 2025</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-[#10B981]">CLEAN</span></td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
              <td className="px-6 py-4 text-right font-mono text-sm text-[--color-wolvio-slate]">-</td>
            </tr>
            <tr className="bg-[--color-wolvio-navy] text-white">
              <td colSpan={3} className="px-6 py-4 font-heading font-bold text-right uppercase tracking-wider text-sm">Portfolio Totals</td>
              <td className="px-6 py-4 text-right font-mono text-lg font-bold text-[#DC2626]">{formatINR(347484)}</td>
              <td className="px-6 py-4 text-right font-mono text-lg font-bold text-[#F59E0B]">{formatINR(576000)}</td>
            </tr>
          </tbody>
        </table>
        <div className="p-4 bg-white border-t border-[--color-wolvio-light] flex justify-end">
          <Button variant="outline" className="border-[--color-wolvio-navy] text-[--color-wolvio-navy] font-semibold">Export CSV</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8 items-start">
      {/* Summary panel (sticky) */}
      <div className="sticky top-6 space-y-6">
        <div className="bg-white rounded-[12px] border border-[--color-wolvio-light] shadow-[0_2px_8px_rgba(10,35,66,0.08)] p-6 flex flex-col items-center text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[--color-wolvio-slate] mb-6">Validation Summary</h2>
          
          <div className="mb-8 w-full">
            <div className={`font-mono text-4xl font-extrabold tracking-tight transition-opacity duration-500 ${showTotals ? 'opacity-100' : 'opacity-0'} ${result.total_gap_amount > 0 ? 'text-[#DC2626]' : 'text-[#10B981]'}`}>
              {showTotals && gapCount > 0 ? formatINR(gapCount) : showTotals && result.total_gap_amount === 0 ? '₹0' : '₹0'}
            </div>
            <div className={`text-sm font-medium mt-1 transition-opacity duration-500 delay-150 ${showTotals ? 'opacity-100' : 'opacity-0'} ${result.total_gap_amount > 0 ? 'text-[#DC2626]' : 'text-[#10B981]'}`}>
              {result.total_gap_amount > 0 ? 'Total Value at Risk' : 'No Gaps Found'}
            </div>
          </div>
          
          <div className={`w-full space-y-3 transition-opacity duration-500 delay-300 ${showTotals ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-red-50 rounded-lg border border-red-100">
              <span className="font-semibold text-sm text-[#DC2626]">{gaps.length} gap{gaps.length !== 1 && 's'} found</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-amber-50 rounded-lg border border-amber-100">
              <span className="font-semibold text-sm text-[#F59E0B]">{opportunities.length} opportunit{opportunities.length === 1 ? 'y' : 'ies'}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-green-50 rounded-lg border border-green-100">
              <span className="font-semibold text-sm text-[#10B981]">{matches.length} matches</span>
            </div>
          </div>

          <div className={`mt-6 w-full transition-opacity duration-500 delay-500 ${showTotals ? 'opacity-100' : 'opacity-0'}`}>
            {result.total_gap_amount > 0 ? (
              <div className="inline-block px-3 py-1 bg-red-100 text-[#DC2626] text-xs font-bold uppercase tracking-wider rounded-full">High Severity</div>
            ) : result.total_opportunity_amount > 0 ? (
              <div className="inline-block px-3 py-1 bg-amber-100 text-[#F59E0B] text-xs font-bold uppercase tracking-wider rounded-full">Medium Severity</div>
            ) : (
              <div className="inline-block px-3 py-1 bg-green-100 text-[#10B981] text-xs font-bold uppercase tracking-wider rounded-full">Low Severity</div>
            )}
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full py-6 border-2 border-[--color-wolvio-navy] text-[--color-wolvio-navy] font-bold text-sm hover:bg-[#F7F8FA]"
          onClick={() => setShowAggregate(true)}
        >
          Run All 6 Invoices
        </Button>
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
