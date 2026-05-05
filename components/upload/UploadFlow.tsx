'use client'

import { useState, useEffect } from 'react'
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

      const uploadRes = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}))
        throw new Error(body.error ?? `Upload failed (HTTP ${uploadRes.status})`)
      }

      const uploadData = await uploadRes.json()
      const newContractId: string = uploadData.contract_id
      setContractId(newContractId)

      const extractRes = await fetch(`/api/contracts/${newContractId}/extract`, { method: 'POST' })
      if (!extractRes.ok) {
        const body = await extractRes.json().catch(() => ({}))
        const msg = body.error || body.detail || `Extraction failed (HTTP ${extractRes.status})`
        throw new Error(msg)
      }
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      console.error('[UploadFlow] Error:', err)
      setError(message)
      setIsExtracting(false)
    }
  }

  const handleComplete = () => {
    if (contractId) {
      router.refresh()
      router.push(`/contracts/${contractId}`)
    }
  }

  const handleReset = () => {
    setIsExtracting(false)
    setContractId(null)
    setError(null)
  }

  if (isExtracting) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 max-w-xl mx-auto shadow-sm">
        <ExtractionAnimation contractId={contractId} onComplete={handleComplete} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DropZone onFile={handleFile} />
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <span className="text-red-500 font-black text-lg flex-shrink-0">✕</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <p className="text-xs text-red-500 mt-0.5">Check that the file is a valid PDF and try again.</p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-white border border-red-200 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
