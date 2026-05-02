'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'

interface DropZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.pdf')) onFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-[12px] border-2 border-dashed border-[--color-wolvio-orange] bg-white py-16 px-12 transition-all cursor-pointer shadow-[0_2px_8px_rgba(10,35,66,0.04)] hover:shadow-[0_4px_12px_rgba(10,35,66,0.08)] hover:-translate-y-0.5',
        dragging && 'bg-orange-50/50 scale-[1.02] border-[--color-wolvio-orange]',
        disabled && 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="p-4 bg-orange-50 rounded-full mb-2">
        <Upload className="text-[--color-wolvio-orange]" size={32} strokeWidth={2.5} />
      </div>
      <div className="text-center space-y-2">
        <p className="font-heading font-bold text-[--color-wolvio-navy] text-xl">Drop your contract PDF here</p>
        <p className="text-sm text-[--color-wolvio-slate] font-medium">or click to browse files</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
