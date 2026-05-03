'use client'

import { ContractParameters } from '@/lib/schemas/contract'
import { GlassCard } from '@/components/ui/glass-card'
import { Cpu, ShieldCheck, Activity } from 'lucide-react'

interface ExtractionQualityScoreProps {
  contract: ContractParameters
}

export function ExtractionQualityScore({ contract }: ExtractionQualityScoreProps) {
  let high = 0
  let medium = 0
  let low = 0
  let notFoundCount = 0
  let total = 0

  const fieldsToCheck = [
    'base_annual_fee',
    'base_monthly_fee',
    'escalation',
    'variable_component',
    'availability_guarantee_pct',
    'ld_rate_per_pp',
    'ld_cap_pct',
    'bonus_threshold_pct',
    'bonus_rate_per_pp',
    'payment_terms_days',
    'late_payment_interest',
    'renewal_notice_months'
  ]

  fieldsToCheck.forEach(key => {
    total++
    const field = (contract as any)[key]
    if (!field || field.value === null || field.value === undefined) {
      notFoundCount++
    } else {
      if (field.confidence === 'high') high++
      else if (field.confidence === 'medium') medium++
      else if (field.confidence === 'low') low++
    }
  })

  const score = total > 0 ? Math.round(((high * 100) + (medium * 50)) / total) : 0

  let colorClass = 'text-[--color-wolvio-red]'
  let accentClass = 'bg-[--color-wolvio-red]'
  let message = 'Manual audit mandatory'

  if (score >= 90) {
    colorClass = 'text-[--color-wolvio-green]'
    accentClass = 'bg-[--color-wolvio-green]'
    message = 'High fidelity extraction'
  } else if (score >= 70) {
    colorClass = 'text-[--color-wolvio-amber]'
    accentClass = 'bg-[--color-wolvio-amber]'
    message = 'Moderate confidence review'
  }

  return (
    <GlassCard className="mb-8 p-8 border-none flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
      {/* Background decoration */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-10 rounded-full ${accentClass}`} />
      
      <div className="flex-1 space-y-6 w-full relative z-10">
        <div className="flex items-center gap-3 text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-[0.4em]">
          <Activity size={14} className={colorClass} /> Intelligence Integrity
        </div>
        
        <div className="space-y-2">
          <div className="flex items-end gap-4">
            <span className={`text-6xl font-heading font-black tracking-tighter ${colorClass}`}>
              {score}%
            </span>
            <div className="pb-2">
               <div className="text-xs font-bold text-white uppercase tracking-widest">{message}</div>
            </div>
          </div>
          
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full ${accentClass} transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_currentColor]`}
              style={{ width: `${score}%`, color: 'inherit' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full lg:w-auto relative z-10">
        {[
          { label: 'High', count: high, color: 'text-[--color-wolvio-green]' },
          { label: 'Medium', count: medium, color: 'text-[--color-wolvio-amber]' },
          { label: 'Low', count: low, color: 'text-[--color-wolvio-red]' },
          { label: 'Missing', count: notFoundCount, color: 'text-white/20' }
        ].map((stat, i) => (stat.count > 0 || stat.label === 'Missing') && (
          <div key={i} className="bg-white/5 border border-white/5 px-6 py-4 rounded-2xl flex flex-col gap-1 min-w-[120px]">
            <span className={`text-xl font-mono font-black ${stat.color}`}>{stat.count}</span>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
