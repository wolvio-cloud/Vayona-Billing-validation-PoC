'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileUp, Loader2 } from 'lucide-react'

interface InvoiceUploadProps {
  onUpload: (file: File) => void
  isProcessing: boolean
}

export function InvoiceUpload({ onUpload, isProcessing }: InvoiceUploadProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[--color-wolvio-slate] rounded-[16px] bg-[--color-wolvio-surface] hover:border-[--color-wolvio-orange] transition-all group">
      <div className="w-16 h-16 bg-[--color-wolvio-navy] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-[--color-wolvio-orange] animate-spin" />
        ) : (
          <FileUp className="w-8 h-8 text-[--color-wolvio-orange]" />
        )}
      </div>
      <h3 className="text-lg font-heading font-bold text-[--color-wolvio-light] mb-2">Upload Live Invoice PDF</h3>
      <p className="text-[--color-wolvio-mid] text-sm mb-6 text-center max-w-xs">
        Test extraction and validation on any digital invoice PDF.
      </p>
      
      <input
        type="file"
        id="invoice-upload"
        className="hidden"
        accept=".pdf"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        disabled={isProcessing}
      />
      <Button 
        asChild 
        className="bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white px-8 py-6 rounded-full font-bold shadow-lg"
      >
        <label htmlFor="invoice-upload" className="cursor-pointer">
          {isProcessing ? 'Extracting Data...' : 'Select Invoice PDF'}
        </label>
      </Button>
    </div>
  )
}
