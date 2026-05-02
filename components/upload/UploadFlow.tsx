'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropZone } from './DropZone'
import { ExtractionAnimation } from './ExtractionAnimation'

export function UploadFlow() {
  const [isExtracting, setIsExtracting] = useState(false)
  const router = useRouter()

  const handleFile = (file: File) => {
    setIsExtracting(true)
    // Simulate upload delay for demo
  }

  const handleComplete = () => {
    // Navigate to the demo contract
    router.push('/contracts/C001')
  }

  if (isExtracting) {
    return (
      <div className="rounded-xl border border-[--color-border] bg-white p-8 shadow-sm max-w-xl mx-auto">
        <ExtractionAnimation onComplete={handleComplete} />
      </div>
    )
  }

  return <DropZone onFile={handleFile} />
}
