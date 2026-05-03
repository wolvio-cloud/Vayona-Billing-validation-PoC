'use client'

import { useState, useEffect } from 'react'
import { ValidationLineItem } from './ValidationLineItem'
import { formatINR } from '@/lib/utils'
import type { ValidationResult } from '@/lib/schemas/validation'
import { Loader2, TrendingDown, TrendingUp, CheckCircle2, Share2, LayoutPanelLeft } from 'lucide-react'
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
        if (progress < 1) {
          window.requestAnimationFrame(step)
        } else {
          setGapCount(result.total_gap_amount)
        }
      }
      window.requestAnimationFrame(step)
    }
  }, [showTotals, result.total_gap_amount])

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-[--color-wolvio-orange] animate-spin opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-[--color-wolvio-orange] rounded-full animate-pulse shadow-[0_0_20px_rgba(242,102,48,0.5)]" />
          </div>
        </div>
        <div className="text-2xl font-heading font-black text-white tracking-tight animate-pulse uppercase">Determining Variances...</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[380px,1fr] gap-12 items-start overflow-visible">
      {/* Executive Summary Panel */}
      {/* We use xl:sticky to ensure it only floats on large screens where there is a side column */}
      <div className="relative xl:sticky xl:top-40 space-y-8 animate-fade-in-up z-20 xl:w-[380px]">
        <div className="glass rounded-[32px] p-8 border-none shadow-[0_32px_64px_-20px_rgba(0,0,0,0.6)] bg-[#030A14]/95 backdrop-blur-2xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[--color-wolvio-orange] to-transparent opacity-50" />
          
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[--color-wolvio-mid] mb-8">Executive Audit</h2>
          
          <div className="mb-10 w-full">
            <div className={`font-mono text-5xl font-black tracking-tighter transition-all duration-700 ${showTotals ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${result.total_gap_amount > 0 ? 'text-[--color-wolvio-red]' : 'text-[--color-wolvio-green]'}`}>
              {formatINR(gapCount)}
            </div>
            <div className={`text-xs font-bold mt-3 tracking-widest uppercase transition-all duration-700 delay-200 ${showTotals ? 'opacity-100' : 'opacity-0'} ${result.total_gap_amount > 0 ? 'text-[--color-wolvio-red]' : 'text-[--color-wolvio-green]'}`}>
              {result.total_gap_amount > 0 ? 'Leakage Identified' : 'Revenue Secured'}
            </div>
          </div>
          
          <div className={`w-full space-y-4 transition-all duration-700 delay-400 ${showTotals ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="flex items-center justify-between px-6 py-4 glass rounded-2xl border-white/5">
              <div className="flex items-center gap-3">
                <TrendingDown size={16} className="text-[--color-wolvio-red]" />
                <span className="text-sm font-bold text-white/80">Gaps</span>
              </div>
              <span className="font-mono font-black text-[--color-wolvio-red]">{gaps.length}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4 glass rounded-2xl border-white/5">
              <div className="flex items-center gap-3">
                <TrendingUp size={16} className="text-[--color-wolvio-amber]" />
                <span className="text-sm font-bold text-white/80">Upside</span>
              </div>
              <span className="font-mono font-black text-[--color-wolvio-amber]">{opportunities.length}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4 glass rounded-2xl border-white/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-[--color-wolvio-green]" />
                <span className="text-sm font-bold text-white/80">Matches</span>
              </div>
              <span className="font-mono font-black text-[--color-wolvio-green]">{matches.length}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 transition-all duration-700 delay-600">
          <Button 
            variant="outline" 
            className="w-full py-8 glass-button text-white font-black text-xs uppercase tracking-widest rounded-2xl border-white/10"
            onClick={() => setShowAggregate(!showAggregate)}
          >
            <LayoutPanelLeft className="w-4 h-4 mr-3" /> Multi-Month Analysis
          </Button>

          <Button 
            className="w-full py-8 bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_15px_40px_-10px_rgba(242,102,48,0.4)] group"
            onClick={() => {
              const html = generateShareReportHtml(result, showAggregate)
              const blob = new Blob([html], { type: 'text/html' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `Wolvio_Report_${result.invoice_id}.html`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }}
          >
            <Share2 className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" /> Export Audit Report
          </Button>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-6 overflow-visible">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-[0.5em]">Line Item Variance Analysis</h3>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>
        
        {result.checks.map((check, idx) => (
          <div 
            key={check.check_id}
            className="animate-fade-in-up"
          >
            <ValidationLineItem check={check} />
          </div>
        ))}
      </div>
    </div>
  )
}
