'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

export function ValidationWarnings({ warnings }: { warnings: string[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!warnings || warnings.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-3 text-amber-800">
          <AlertTriangle size={20} className="text-amber-600" />
          <span className="font-semibold text-sm">
            ⚠ {warnings.length} extraction warning{warnings.length === 1 ? '' : 's'} — review before validating
          </span>
        </div>
        <div className="text-amber-600">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-amber-200/50">
          <ul className="space-y-2 mt-2">
            {warnings.map((warning, i) => (
              <li key={i} className="flex gap-2 text-sm text-amber-900">
                <span className="font-mono text-amber-600 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
