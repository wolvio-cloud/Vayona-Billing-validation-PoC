'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ParameterFieldProps {
  label: string
  value: string
  clauseReference: string
  pageNumber: number
  sourceClause: string
  confidence?: 'high' | 'medium' | 'low'
}

export function ParameterField({ label, value, clauseReference, pageNumber, sourceClause, confidence }: ParameterFieldProps) {
  const [expanded, setExpanded] = useState(false)
  
  const confidenceColor = 
    confidence === 'high' ? 'bg-[#22C55E]' : 
    confidence === 'low' ? 'bg-[#EF4444]' : 
    'bg-[#F59E0B]'

  return (
    <div 
      className="bg-[--color-wolvio-surface] rounded-[12px] border border-[--color-wolvio-slate] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex-1 flex flex-col justify-between group cursor-pointer hover:bg-[--color-wolvio-navy] transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[--color-wolvio-mid] uppercase tracking-wider">{label}</h4>
            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${confidenceColor}`} title={`Confidence: ${confidence}`} />
          </div>
          <div className="font-mono text-xl font-bold text-[--color-wolvio-light] break-words leading-tight">{value}</div>
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-[--color-wolvio-orange] text-xs font-semibold rounded-full border border-orange-500/30 transition-colors group-hover:bg-orange-500/20">
            <span>{clauseReference}</span>
            <span className="opacity-50">·</span>
            <span>Page {pageNumber}</span>
          </div>
          <div className="text-[--color-wolvio-slate] group-hover:text-[--color-wolvio-orange] transition-colors">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-6 py-4 bg-[--color-wolvio-dark] border-t border-[--color-wolvio-slate] animate-in slide-in-from-top-2">
          <div className="text-[10px] font-bold text-[--color-wolvio-mid] mb-2 uppercase tracking-widest">Verbatim Text</div>
          <p className="text-sm italic text-[--color-wolvio-light] leading-relaxed">"{sourceClause}"</p>
        </div>
      )}
    </div>
  )
}
