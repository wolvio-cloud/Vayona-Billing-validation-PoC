'use client'

import { useState } from 'react'
import { Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'

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
    confidence === 'high' ? 'bg-green-500' : 
    confidence === 'low' ? 'bg-red-500' : 
    confidence === 'manual_input' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' :
    'bg-amber-500'

  const handleSave = () => {
    onManualValue?.(tempValue)
    setIsEditing(false)
  }

  return (
    <GlassCard 
      hover={!isEditing}
      className={`transition-all duration-500 group overflow-hidden flex flex-col ${
        isEditing ? 'border-[--color-wolvio-orange] ring-1 ring-[--color-wolvio-orange]' : 'border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)]'
      }`}
    >
      <div className="p-8 flex-1 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-10 rounded-full translate-x-16 -translate-y-16 ${confidenceColor}`} />
        
        <div className="space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-[0.3em]">{label}</h4>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${confidenceColor} ${confidence !== 'manual_input' ? 'shadow-[0_0_10px_currentColor]' : ''}`} />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{confidence} confidence</span>
            </div>
          </div>
          
          <div className="py-2">
            {isEditing ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <input 
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono font-bold text-white outline-none focus:border-[--color-wolvio-orange] transition-colors"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-[--color-wolvio-orange] text-white py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#d95a2b] transition-colors"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setTempValue(value || '') }}
                    className="px-4 bg-white/5 text-white/60 py-2 rounded-lg text-xs font-bold uppercase hover:bg-white/10 transition-colors"
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
                <div className={`text-3xl font-heading font-black tracking-tighter transition-colors ${isNotFound ? 'text-red-500/60' : 'text-white group-hover/val:text-[--color-wolvio-orange]'}`}>
                  {value || 'NOT FOUND'}
                </div>
                <div className="absolute -right-2 top-0 opacity-0 group-hover/val:opacity-100 transition-opacity">
                   <div className="p-1 bg-[--color-wolvio-orange]/10 rounded border border-[--color-wolvio-orange]/20">
                     <Edit2 size={12} className="text-[--color-wolvio-orange]" />
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[--color-wolvio-orange] border border-white/10 uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {clauseReference} · Pg {pageNumber}
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-white/20 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <div className="text-[10px] font-black text-white/20 mb-3 uppercase tracking-widest">Source Clause</div>
            <p className="text-sm italic text-[--color-wolvio-mid] leading-relaxed border-l-2 border-white/10 pl-4">
              {confidence === 'manual_input' ? 'Manual entry by controller. Verify against original contract.' : `"${sourceClause}"`}
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
