'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'

export function ValidationWarnings({ warnings }: { warnings: string[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!warnings || warnings.length === 0) return null

  return (
    <GlassCard variant="orange" className="mb-8 border-none overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-wolvio-orange/20 rounded-xl flex items-center justify-center border border-wolvio-orange/30">
            <AlertTriangle size={20} className="text-wolvio-orange animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Data Quality Alert</h4>
            <p className="text-[10px] font-bold text-wolvio-orange uppercase tracking-widest">
              {warnings.length} Extraction warning{warnings.length === 1 ? '' : 's'} requiring audit
            </p>
          </div>
        </div>
        <div className="text-wolvio-orange/50 group-hover:text-wolvio-orange transition-colors">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {expanded && (
        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
            <ul className="space-y-3">
              {warnings.map((warning, i) => (
                <li key={i} className="flex gap-4 text-sm text-white/70 leading-relaxed">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-wolvio-orange shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
