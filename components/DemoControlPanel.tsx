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
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
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
    <div className="fixed bottom-6 right-6 z-[100] w-80 glass rounded-[32px] p-6 shadow-[0_32px_64px_-20px_rgba(0,0,0,0.8)] border border-white/10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-[--color-wolvio-orange]" />
          <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-white">Demo Pilot</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors p-1">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => {
            router.push('/welcome')
            setIsOpen(false)
          }}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 text-sm font-bold text-white/80 group"
        >
          <RotateCcw size={16} className="group-hover:rotate-[-90deg] transition-transform" />
          Restart Experience
        </button>
        
        <button 
          onClick={() => {
            router.push('/contracts/C001')
            setIsOpen(false)
          }}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 text-sm font-bold text-white/80"
        >
          <ExternalLink size={16} />
          Demo Contract (C001)
        </button>
        
        <button 
          onClick={() => setIsConfidential(!isConfidential)}
          className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 text-sm font-bold text-white/80 group"
        >
          <div className="flex items-center gap-3">
            <Shield size={16} className={isConfidential ? 'text-green-400' : 'text-white/40'} />
            <span>Confidential Mode</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${isConfidential ? 'bg-green-500/50' : 'bg-white/10'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isConfidential ? 'left-6' : 'left-1'}`} />
          </div>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold text-white/20 tracking-widest uppercase italic">Wolvio Demo Engine v2.0</p>
      </div>
    </div>
  )
}
