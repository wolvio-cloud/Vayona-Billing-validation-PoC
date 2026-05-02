'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

export function ValidationWarnings({ warnings }: { warnings: string[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!warnings || warnings.length === 0) return null

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-[12px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-500/20 transition-colors"
      >
        <div className="flex items-center gap-3 text-[#F59E0B]">
          <AlertTriangle size={20} className="text-[#F59E0B]" />
          <span className="font-semibold text-sm">
            ⚠ {warnings.length} extraction warning{warnings.length === 1 ? '' : 's'} — review before validating
          </span>
        </div>
        <div className="text-[#F59E0B]">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-amber-500/20">
          <ul className="space-y-2 mt-2">
            {warnings.map((warning, i) => (
              <li key={i} className="flex gap-2 text-sm text-[--color-wolvio-mid]">
                <span className="font-mono text-[#F59E0B] mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
