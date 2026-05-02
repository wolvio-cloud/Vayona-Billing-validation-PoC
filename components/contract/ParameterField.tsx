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
    confidence === 'high' ? 'bg-[#10B981]' : 
    confidence === 'low' ? 'bg-[#DC2626]' : 
    'bg-[#F59E0B]'

  return (
    <div 
      className="bg-white rounded-[12px] border border-[--color-wolvio-light] shadow-[0_2px_8px_rgba(10,35,66,0.04)] transition-all duration-300 hover:shadow-[0_6px_16px_rgba(10,35,66,0.08)] hover:-translate-y-0.5 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex-1 flex flex-col justify-between group cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[--color-wolvio-slate] uppercase tracking-wider">{label}</h4>
            <div className={`w-2 h-2 rounded-full ${confidenceColor}`} title={`Confidence: ${confidence}`} />
          </div>
          <div className="font-mono text-xl font-medium text-[--color-wolvio-navy] break-words leading-tight">{value}</div>
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[--color-wolvio-orange] text-xs font-semibold rounded-full border border-orange-100 transition-colors group-hover:bg-orange-100">
            <span>{clauseReference}</span>
            <span className="opacity-50">·</span>
            <span>Page {pageNumber}</span>
          </div>
          <div className="text-[--color-wolvio-mid] group-hover:text-[--color-wolvio-orange] transition-colors">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-6 py-4 bg-[--color-wolvio-off] border-t border-[--color-wolvio-light] animate-in slide-in-from-top-2">
          <div className="text-xs font-medium text-[--color-wolvio-slate] mb-1 uppercase tracking-wider">Verbatim Text</div>
          <p className="text-sm italic text-[--color-wolvio-navy] leading-relaxed">"{sourceClause}"</p>
        </div>
      )}
    </div>
  )
}
