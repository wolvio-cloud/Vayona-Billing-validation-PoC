'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, FileText } from 'lucide-react'

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
        'group flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 px-12 transition-all cursor-pointer relative overflow-hidden hover:border-wolvio-orange/40 hover:bg-orange-50/30',
        dragging && 'bg-orange-50 border-wolvio-orange shadow-sm',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300',
          dragging
            ? 'bg-wolvio-orange text-white border-wolvio-orange shadow-lg'
            : 'bg-orange-50 text-wolvio-orange border-orange-100 group-hover:bg-wolvio-orange group-hover:text-white group-hover:border-wolvio-orange group-hover:shadow-md'
        )}>
          <Upload size={26} strokeWidth={2.5} />
        </div>

        <div className="text-center space-y-2">
          <p className="font-heading font-black text-slate-900 text-xl tracking-tight">
            Deploy Agreement
          </p>
          <div className="flex items-center gap-2 justify-center text-slate-400 text-sm font-medium">
            <FileText size={14} />
            Text-searchable PDFs only
          </div>
        </div>

        <div className="px-5 py-2 rounded-lg bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:border-wolvio-orange/30 group-hover:text-wolvio-orange transition-colors shadow-sm">
          Drag &amp; Drop or Browse
        </div>
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
