'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function DemoControlPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfidential, setIsConfidential] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'd') {
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
    <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-[--color-border] bg-white p-4 shadow-xl w-72 text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[--color-wolvio-navy]">Demo Controls</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black">✕</button>
      </div>

      <div className="space-y-2">
        <button 
          onClick={() => {
            router.push('/')
            setIsOpen(false)
          }}
          className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
        >
          🔄 Reset Demo (Go to Home)
        </button>
        
        <button 
          onClick={() => {
            router.push('/contracts/C001')
            setIsOpen(false)
          }}
          className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
        >
          📄 Pre-select Contract A
        </button>
        
        <button 
          className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-500 line-through"
          title="Not applicable in local mock mode"
        >
          ⚡ Toggle Live/Cached Mode
        </button>

        <button 
          onClick={() => setIsConfidential(!isConfidential)}
          className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex justify-between"
        >
          <span>👁️ Confidential Mode</span>
          <span className={isConfidential ? 'text-green-600 font-bold' : 'text-gray-400'}>
            {isConfidential ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  )
}
