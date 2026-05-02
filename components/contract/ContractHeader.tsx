import { formatINRShort } from '@/lib/utils'

interface ContractHeaderProps {
  displayName: string
  isDemo?: boolean
  annualFee?: number
  termYears?: number
  counterparty?: string
}

export function ContractHeader({ displayName, isDemo, annualFee, termYears, counterparty }: ContractHeaderProps) {
  return (
    <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(10,35,66,0.08)] flex items-center justify-between border border-[--color-wolvio-light]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading font-extrabold text-2xl text-[--color-wolvio-navy]">{displayName}</h1>
          <span className="px-2 py-1 bg-[--color-wolvio-navy] text-white text-xs font-bold uppercase tracking-wider rounded-md">LTSA</span>
          {isDemo && <span className="px-2 py-1 bg-orange-100 text-[--color-wolvio-orange] text-xs font-bold uppercase tracking-wider rounded-md">Demo</span>}
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-[--color-wolvio-slate]">
          {counterparty && <span>Party: {counterparty}</span>}
          <span className="text-[--color-wolvio-light]">|</span>
          {annualFee && <span>Value: {formatINRShort(annualFee)}/yr</span>}
          <span className="text-[--color-wolvio-light]">|</span>
          {termYears && <span>Term: {termYears} years</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
        <span className="text-sm font-semibold text-[#10B981] uppercase tracking-wide">Extracted</span>
      </div>
    </div>
  )
}
