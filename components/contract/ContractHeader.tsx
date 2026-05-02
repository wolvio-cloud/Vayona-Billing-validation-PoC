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
    <div className="bg-[--color-wolvio-surface] rounded-[12px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-between border border-[--color-wolvio-slate]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading font-extrabold text-2xl text-[--color-wolvio-light]">{displayName}</h1>
          <span className="px-2 py-1 bg-[--color-wolvio-navy] border border-[--color-wolvio-slate] text-[--color-wolvio-light] text-xs font-bold uppercase tracking-wider rounded-md">LTSA</span>
          {isDemo && <span className="px-2 py-1 bg-orange-500/20 text-[--color-wolvio-orange] border border-orange-500/30 text-xs font-bold uppercase tracking-wider rounded-md">Demo</span>}
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-[--color-wolvio-mid]">
          {counterparty && <span>Party: {counterparty}</span>}
          <span className="text-[--color-wolvio-slate]">|</span>
          {annualFee && <span>Value: {formatINRShort(annualFee)}/yr</span>}
          <span className="text-[--color-wolvio-slate]">|</span>
          {termYears && <span>Term: {termYears} years</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
        <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
        <span className="text-sm font-semibold text-[#22C55E] uppercase tracking-wide">Extracted</span>
      </div>
    </div>
  )
}
