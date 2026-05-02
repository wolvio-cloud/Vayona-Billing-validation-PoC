'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropZone } from './DropZone'
import { ExtractionAnimation } from './ExtractionAnimation'

export function UploadFlow() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [contractId, setContractId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFile = async (file: File) => {
    setIsExtracting(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      const data = await res.json()
      setContractId(data.contract_id)
      
      // Start extraction
      fetch(`/api/contracts/${data.contract_id}/extract`, { method: 'POST' })
    } catch (err) {
      console.error(err)
      setError('Failed to upload contract. Please try again.')
      setIsExtracting(false)
    }
  }

  const handleComplete = () => {
    if (contractId) {
      router.push(`/contracts/${contractId}`)
    }
  }

  if (isExtracting) {
    return (
      <div className="rounded-xl border border-[--color-wolvio-slate] bg-[--color-wolvio-surface] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-w-xl mx-auto">
        <ExtractionAnimation contractId={contractId} onComplete={handleComplete} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DropZone onFile={handleFile} />
      {error && (
        <p className="text-center text-sm font-medium text-[#EF4444] animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  )
}
