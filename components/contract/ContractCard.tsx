import { formatINRShort } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface ContractCardProps {
  id: string
  contractId: string
  displayName: string
  isDemo?: boolean
  annualFee?: number
  termYears?: number
  counterparty?: string
}

export function ContractCard({ contractId, displayName, isDemo, annualFee, termYears, counterparty }: ContractCardProps) {
  return (
    <div className="group flex items-center justify-between p-6 bg-white rounded-[12px] shadow-[0_2px_8px_rgba(10,35,66,0.08)] overflow-hidden relative transition-all duration-300 hover:shadow-[0_8px_24px_rgba(10,35,66,0.12)] hover:-translate-y-1">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[--color-wolvio-orange]" />
      
      <div className="space-y-4 pl-4">
        <div className="flex items-center gap-3">
          <h3 className="font-heading font-bold text-xl text-[--color-wolvio-navy]">{displayName}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {counterparty && <span className="px-3 py-1 bg-[--color-wolvio-off] text-[--color-wolvio-slate] text-sm font-medium rounded-full">{counterparty}</span>}
          {annualFee && <span className="px-3 py-1 bg-[--color-wolvio-off] text-[--color-wolvio-slate] text-sm font-medium rounded-full">{formatINRShort(annualFee)}/year</span>}
          {termYears && <span className="px-3 py-1 bg-[--color-wolvio-off] text-[--color-wolvio-slate] text-sm font-medium rounded-full">{termYears} years</span>}
        </div>
      </div>
      
      <Link 
        href={`/contracts/${contractId}`}
        className="flex items-center gap-2 bg-[--color-wolvio-orange] hover:bg-[#e05a28] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
      >
        Load Demo Contract <ArrowRight size={18} />
      </Link>
    </div>
  )
}
