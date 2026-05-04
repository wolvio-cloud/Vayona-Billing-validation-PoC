'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'

export function ConfidentialBanner() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsActive(document.body.classList.contains('confidential-mode'))
        }
      })
    })

    observer.observe(document.body, { attributes: true })
    
    // Initial check
    setIsActive(document.body.classList.contains('confidential-mode'))

    return () => observer.disconnect()
  }, [])

  if (!isActive) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] animate-in slide-in-from-top duration-300">
      <div className="bg-wolvio-orange text-white py-2 px-6 flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(242,107,56,0.4)]">
        <ShieldAlert size={16} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Confidential Mode Active</span>
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Financial Data Obscured</span>
      </div>
    </div>
  )
}
