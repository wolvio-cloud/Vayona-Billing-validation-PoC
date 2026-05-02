'use client'

import { ContractParameters } from '@/lib/schemas/contract'

interface ExtractionQualityScoreProps {
  contract: ContractParameters
}

export function ExtractionQualityScore({ contract }: ExtractionQualityScoreProps) {
  let high = 0
  let medium = 0
  let low = 0
  let notFound = 0
  let total = 0

  // The specific traced fields we expect in the contract schema
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
      notFound++
    } else {
      if (field.confidence === 'high') high++
      else if (field.confidence === 'medium') medium++
      else if (field.confidence === 'low') low++
    }
  })

  // Calculate score (e.g., 100 for high, 50 for medium, 0 for low/not found)
  const scoreRaw = total > 0 ? ((high * 100) + (medium * 50)) / total : 0
  const score = Math.round(scoreRaw)

  let colorClass = 'text-[#EF4444]'
  let bgClass = 'bg-[#EF4444]'
  let message = 'Manual review recommended before use'

  if (score >= 90) {
    colorClass = 'text-[#22C55E]'
    bgClass = 'bg-[#22C55E]'
    message = 'Reliable for billing validation'
  } else if (score >= 70) {
    colorClass = 'text-[#F59E0B]'
    bgClass = 'bg-[#F59E0B]'
    message = 'Review flagged fields before validating'
  }

  // Generate the progress bar chunks
  const barChunks = 20
  const filledChunks = Math.round((score / 100) * barChunks)

  return (
    <div className="bg-[--color-wolvio-surface] rounded-[12px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[--color-wolvio-slate] mb-6 flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[--color-wolvio-mid]">Extraction Quality</h3>
        <div className="flex items-center gap-4">
          <div className="font-mono text-2xl tracking-tighter text-[--color-wolvio-slate] flex">
            {Array.from({ length: barChunks }).map((_, i) => (
              <span key={i} className={i < filledChunks ? colorClass : 'opacity-30'}>
                {i < filledChunks ? '█' : '░'}
              </span>
            ))}
          </div>
          <span className={`font-mono text-3xl font-extrabold ${colorClass}`}>{score}%</span>
        </div>
        <p className={`font-semibold text-sm ${colorClass}`}>{message}</p>
      </div>

      <div className="w-full md:w-auto grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-mono p-4 bg-[--color-wolvio-dark] rounded-xl border border-[--color-wolvio-slate]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#22C55E]">{high}</span>
          <span className="text-[--color-wolvio-mid]">high confidence</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#F59E0B]">{medium}</span>
          <span className="text-[--color-wolvio-mid]">medium conf</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#EF4444]">{low}</span>
          <span className="text-[--color-wolvio-mid]">low confidence</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[--color-wolvio-slate]">{notFound}</span>
          <span className="text-[--color-wolvio-mid]">not found</span>
        </div>
      </div>
    </div>
  )
}
