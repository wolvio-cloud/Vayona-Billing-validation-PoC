'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, RotateCcw, Shield, ExternalLink, X } from 'lucide-react'

export function DemoControlPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfidential, setIsConfidential] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger on Win+Shift+D (Meta key)
      if (e.metaKey && e.shiftKey && e.key.toUpperCase() === 'D') {
        e.preventDefault()
        setIsConfidential((prev) => !prev)
      }
      
      // Ctrl+Shift+D opens the settings panel for the operator
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'D') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isConfidential) {
      document.body.classList.add('confidential-mode')
    } else {
      document.body.classList.remove('confidential-mode')
    }
  }, [isConfidential])

  if (!isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 bg-white border border-slate-200 rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-wolvio-orange" />
          <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-slate-900">Demo Pilot</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => {
            router.push('/welcome')
            setIsOpen(false)
          }}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 text-sm font-bold text-slate-600 group"
        >
          <RotateCcw size={16} className="group-hover:rotate-[-90deg] transition-transform" />
          Restart Experience
        </button>
        
        <button 
          onClick={() => {
            router.push('/contracts/C001')
            setIsOpen(false)
          }}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 text-sm font-bold text-slate-600"
        >
          <ExternalLink size={16} />
          Demo Contract (C001)
        </button>
        
        <button 
          onClick={() => setIsConfidential(!isConfidential)}
          className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 text-sm font-bold text-slate-600 group"
        >
          <div className="flex items-center gap-3">
            <Shield size={16} className={isConfidential ? 'text-emerald-600' : 'text-slate-300'} />
            <span>Confidential Mode</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${isConfidential ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isConfidential ? 'left-6' : 'left-1'}`} />
          </div>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase italic">Wolvio Demo Engine v2.0</p>
      </div>
    </div>
  )
}
