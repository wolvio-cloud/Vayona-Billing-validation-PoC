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
      // Step 1: Upload the file
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

      // Step 2: Trigger extraction — awaited so errors surface in the UI
      // ExtractionAnimation polls the contract endpoint, so we fire and track
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
      <div className="rounded-xl border border-[--color-wolvio-slate] bg-[--color-wolvio-surface] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-w-xl mx-auto">
        <ExtractionAnimation contractId={contractId} onComplete={handleComplete} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DropZone onFile={handleFile} />
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-red-400 font-black text-lg">✕</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <p className="text-xs text-red-400/60 mt-0.5">Check that the file is a valid PDF and try again.</p>
          </div>
          <button
            onClick={handleReset}
            className="text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
