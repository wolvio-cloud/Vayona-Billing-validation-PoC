'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface InvoiceSelectorProps {
  contractId: string
  allInvoices: string[]
  currentInvoiceId: string
  onSelect?: (invoiceId: string) => void
}

const INV_DOT: Record<string, string> = {
  'INV-001': 'bg-[#22C55E]',  // green = clean
  'INV-002': 'bg-[#EF4444]',  // red   = gap (main demo scenario)
  'INV-003': 'bg-[#EF4444]',  // red   = gap / opportunity
  'INV-004': 'bg-[#F59E0B]',  // amber = disputed / LD
  'INV-005': 'bg-[#22C55E]',  // green = clean / bonus opportunity
  'INV-006': 'bg-[#22C55E]',  // green = clean
}

export function InvoiceSelector({ contractId, allInvoices, currentInvoiceId, onSelect }: InvoiceSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null)

  const handleSelect = (inv: string) => {
    if (inv === currentInvoiceId) return
    
    setLoadingInvoice(inv)
    startTransition(() => {
      // Update URL which triggers Server Component re-render
      router.push(`/contracts/${contractId}/validate?invoice=${inv}`, { scroll: false })
      if (onSelect) onSelect(inv)
      
      // Smooth scroll to the validation view after a short delay to allow re-render
      setTimeout(() => {
        const element = document.getElementById('validation-content')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        setLoadingInvoice(null)
      }, 500)
    })
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide px-2">
      {allInvoices.map(inv => {
        const isActive = currentInvoiceId === inv
        const isLoading = loadingInvoice === inv && isPending
        const dotColor = INV_DOT[inv] ?? 'bg-slate-300'
        
        return (
          <button
            key={inv}
            disabled={isPending}
            onClick={() => handleSelect(inv)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
              isActive
                ? 'bg-wolvio-orange text-white border-wolvio-orange shadow-md'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
            } ${isPending && !isLoading ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <Loader2 className={`w-3.5 h-3.5 animate-spin ${isActive ? 'text-white' : 'text-wolvio-orange'}`} />
            ) : (
              <div className={`w-2 h-2 rounded-full ${dotColor} ${isActive ? 'ring-2 ring-white/20' : ''}`} />
            )}
            <span>{inv}</span>
          </button>
        )
      })}
    </div>
  )
}
