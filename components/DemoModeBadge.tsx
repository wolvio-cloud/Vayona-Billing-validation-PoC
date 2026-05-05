'use client'

import { useState, useEffect } from 'react'

export type DemoMode = 'demo' | 'live'

const STORAGE_KEY = 'vayona_demo_mode'

export function useDemoMode() {
  const [mode, setModeState] = useState<DemoMode>('demo')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) as DemoMode : null
    if (stored === 'live' || stored === 'demo') setModeState(stored)
  }, [])

  const setMode = (m: DemoMode) => {
    setModeState(m)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, m)
  }

  return { mode, setMode }
}

export function DemoModeBadge() {
  const { mode, setMode } = useDemoMode()

  return (
    <div className="flex items-center gap-3">
      {/* Live mode warning */}
      {mode === 'live' && (
        <div className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          ⚠️ Live Mode: Results depend on document quality
        </div>
      )}
      <div className="flex items-center gap-1 bg-slate-100 rounded-full px-1 py-1 border border-slate-200">
        <button
          onClick={() => setMode('demo')}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'demo'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          🎯 Demo
        </button>
        <button
          onClick={() => setMode('live')}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'live'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          ⚡ Live
        </button>
      </div>
    </div>
  )
}
