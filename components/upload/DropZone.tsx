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
        'group flex flex-col items-center justify-center gap-6 rounded-[40px] border-2 border-dashed border-white/10 glass py-20 px-12 transition-all cursor-pointer relative overflow-hidden',
        dragging && 'bg-white/10 scale-[1.02] border-[--color-wolvio-orange]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[--color-wolvio-orange]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-[--color-wolvio-orange]/10 rounded-3xl flex items-center justify-center border border-[--color-wolvio-orange]/20 shadow-[0_0_30px_rgba(242,102,48,0.2)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          <Upload className="text-[--color-wolvio-orange]" size={32} strokeWidth={2.5} />
        </div>
        
        <div className="text-center space-y-3">
          <p className="font-heading font-black text-white text-2xl tracking-tight">Deploy Agreement</p>
          <div className="flex items-center gap-2 justify-center text-[--color-wolvio-mid] text-sm font-semibold tracking-wide uppercase">
            <FileText size={14} /> Only text-searchable PDFs
          </div>
        </div>
        
        <div className="px-6 py-2 rounded-full glass border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[--color-wolvio-mid] group-hover:text-white transition-colors">
          Drag & Drop or Browse
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
