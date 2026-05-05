'use client'

import { useState } from 'react'
import { Edit2, ChevronDown, ChevronUp } from 'lucide-react'

interface ParameterFieldProps {
  label: string
  value: string | null
  clauseReference: string
  pageNumber: number
  sourceClause: string
  confidence?: 'high' | 'medium' | 'low' | 'manual_input'
  onManualValue?: (val: string) => void
  isLoading?: boolean
}

export function ParameterField({ label, value, clauseReference, pageNumber, sourceClause, confidence, onManualValue, isLoading }: ParameterFieldProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value || '')
  
  const isNotFound = !value || value === 'NOT FOUND'

  const confidenceColor = 
    isLoading ? 'bg-slate-200 animate-pulse' :
    confidence === 'high' ? 'bg-green-500' : 
    confidence === 'low' ? 'bg-red-500' : 
    confidence === 'manual_input' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' :
    'bg-amber-500'

  const handleSave = () => {
    onManualValue?.(tempValue)
    setIsEditing(false)
  }

  return (
    <div 
      className={`bg-white rounded-xl border transition-all flex flex-col shadow-sm ${
        isEditing ? 'border-wolvio-orange' : 'border-slate-200'
      }`}
    >
      <div className="p-6 flex-1 flex flex-col justify-between relative overflow-hidden">
        
        <div className="space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</h4>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${confidenceColor}`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {isLoading ? 'Processing' : confidence}
              </span>
            </div>
          </div>
          
          <div className="py-2">
            {isLoading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-8 bg-slate-100 rounded w-24"></div>
              </div>
            ) : isEditing ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-mono font-bold text-slate-900 outline-none focus:border-wolvio-orange transition-colors"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-wolvio-orange text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setTempValue(value || '') }}
                    className="px-4 bg-slate-100 text-slate-400 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="group/val cursor-pointer relative"
                onClick={() => setIsEditing(true)}
              >
                <div className={`text-2xl font-heading font-bold tracking-tight transition-colors ${isNotFound ? 'text-red-500/60' : 'text-slate-900'}`}>
                  {value || 'NOT FOUND'}
                </div>
                <div className="absolute -right-2 top-0 opacity-0 group-hover/val:opacity-100 transition-opacity">
                   <div className="p-1 bg-wolvio-orange/10 rounded border border-wolvio-orange/20">
                     <Edit2 size={12} className="text-wolvio-orange" />
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-wolvio-orange border border-slate-100 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {clauseReference} · Pg {pageNumber}
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-slate-300 hover:text-slate-500 transition-colors"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
            <div className="text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Source Clause</div>
            <p className="text-sm italic text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-4">
              {confidence === 'manual_input' ? 'Manual entry by controller. Verify against original contract.' : `"${sourceClause}"`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
