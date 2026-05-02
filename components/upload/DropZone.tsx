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
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[--color-mid] bg-[--color-off] py-12 px-8 transition-colors cursor-pointer',
        dragging && 'border-[--color-wolvio-orange] bg-orange-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <Upload className="text-[--color-muted-foreground]" size={32} />
      <div className="text-center">
        <p className="font-medium text-[--color-wolvio-navy]">Drag & drop contract PDF here</p>
        <p className="text-sm text-[--color-muted-foreground]">or click to upload</p>
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
