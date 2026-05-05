import { formatINRShort } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight, Building2, Calendar, Banknote } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'

interface ContractCardProps {
  id: string
  contractId: string
  displayName: string
  isDemo?: boolean
  annualFee?: number
  termYears?: number
  counterparty?: string
}

export function ContractCard({ contractId, displayName, annualFee, termYears, counterparty }: ContractCardProps) {
  return (
    <Link href={`/contracts/${contractId}`} className="block group">
      <div className="relative bg-white p-8 rounded-2xl border border-slate-200 shadow-sm group-hover:border-wolvio-orange/30 transition-all duration-300">
        {/* Hover Glow */}
        <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-black text-wolvio-orange uppercase tracking-[0.4em]">Active Agreement</div>
              <h3 className="font-heading font-black text-3xl text-slate-900 tracking-tight">{displayName}</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              {counterparty && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{counterparty}</span>
                </div>
              )}
              {annualFee && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Banknote size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{formatINRShort(annualFee)} / YR</span>
                </div>
              )}
              {termYears && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{termYears} YEARS</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:bg-wolvio-orange group-hover:border-wolvio-orange transition-all duration-500 group-hover:shadow-lg group-hover:shadow-orange-500/20">
            <ArrowRight size={24} className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}

