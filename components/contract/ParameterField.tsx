'use client'

import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'

interface ParameterFieldProps {
  label: string
  value: string | null
  clauseReference: string
  pageNumber: number
  sourceClause: string
  confidence?: 'high' | 'medium' | 'low' | 'manual_input'
  onManualValue?: (val: string) => void
}

export function ParameterField({ label, value, clauseReference, pageNumber, sourceClause, confidence, onManualValue }: ParameterFieldProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value || '')
  
  const isNotFound = !value || value === 'NOT FOUND'

  const confidenceColor = 
    confidence === 'high' ? 'bg-[#22C55E]' : 
    confidence === 'low' ? 'bg-[#EF4444]' : 
    confidence === 'manual_input' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' :
    'bg-[#F59E0B]'

  const handleSave = () => {
    onManualValue?.(tempValue)
    setIsEditing(false)
  }

  return (
    <div 
      className={`bg-[--color-wolvio-surface] rounded-[12px] border transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col ${
        isEditing ? 'border-[--color-wolvio-orange] ring-1 ring-[--color-wolvio-orange]' : 'border-[--color-wolvio-slate]'
      }`}
    >
      <div className="p-6 flex-1 flex flex-col justify-between group">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[--color-wolvio-mid] uppercase tracking-wider">{label}</h4>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${confidenceColor}`} title={`Confidence: ${confidence}`} />
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[--color-wolvio-navy] rounded transition-all"
                >
                  <Edit2 size={12} className="text-[--color-wolvio-orange]" />
                </button>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                autoFocus
                className="flex-1 bg-[--color-wolvio-dark] border border-[--color-wolvio-slate] rounded px-3 py-1 text-white font-mono text-lg focus:outline-none focus:border-[--color-wolvio-orange]"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button onClick={handleSave} className="p-1.5 bg-green-500/20 text-[#22C55E] rounded hover:bg-green-500/30">
                <Check size={16} />
              </button>
              <button onClick={() => { setIsEditing(false); setTempValue(value || '') }} className="p-1.5 bg-red-500/20 text-[#EF4444] rounded hover:bg-red-500/30">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div 
              className={`font-mono text-xl font-bold break-words leading-tight cursor-pointer ${isNotFound ? 'text-[#EF4444]/60 italic' : 'text-[--color-wolvio-light]'}`}
              onClick={() => setExpanded(!expanded)}
            >
              {value || 'NOT FOUND'}
            </div>
          )}
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-[--color-wolvio-orange] text-xs font-semibold rounded-full border border-orange-500/30 transition-colors group-hover:bg-orange-500/20 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <span>{isNotFound && !isEditing ? 'ABSENT' : clauseReference}</span>
            <span className="opacity-50">·</span>
            <span>Page {pageNumber}</span>
          </div>
          <div className="text-[--color-wolvio-slate] group-hover:text-[--color-wolvio-orange] transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-6 py-4 bg-[--color-wolvio-dark] border-t border-[--color-wolvio-slate] animate-in slide-in-from-top-2">
          <div className="text-[10px] font-bold text-[--color-wolvio-mid] mb-2 uppercase tracking-widest">Source Context</div>
          <p className="text-sm italic text-[--color-wolvio-light] leading-relaxed">
            {confidence === 'manual_input' ? 'Manual entry by controller. Verify against original contract.' : `"${sourceClause}"`}
          </p>
        </div>
      )}
    </div>
  )
}

