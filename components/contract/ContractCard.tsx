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
      <GlassCard hover className="p-8 border-none shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]">
        {/* Hover Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[--color-wolvio-orange]/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-black text-[--color-wolvio-orange] uppercase tracking-[0.4em]">Active Agreement</div>
              <h3 className="font-heading font-black text-3xl text-white tracking-tight">{displayName}</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              {counterparty && (
                <div className="flex items-center gap-2 text-white/60">
                  <Building2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{counterparty}</span>
                </div>
              )}
              {annualFee && (
                <div className="flex items-center gap-2 text-white/60">
                  <Banknote size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{formatINRShort(annualFee)} / YR</span>
                </div>
              )}
              {termYears && (
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">{termYears} YEARS</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-[--color-wolvio-orange] group-hover:border-[--color-wolvio-orange] transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(242,102,48,0.4)]">
            <ArrowRight size={24} className="text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}

