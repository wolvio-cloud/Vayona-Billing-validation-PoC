'use client'

import { useState } from 'react'
import { ContractParameters } from '@/lib/schemas/contract'
import { formatINR } from '@/lib/utils'

interface ContractSimulatorProps {
  contract: ContractParameters
  termYears: number
}

function formatINRShort(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`
  return `₹${value.toLocaleString('en-IN')}`
}

export function ContractSimulator({ contract, termYears }: ContractSimulatorProps) {
  const [availability, setAvailability] = useState(93)
  const [wpiIncrease, setWpiIncrease] = useState(4)

  const guarantee = contract.availability_guarantee_pct?.value || 97
  const baseAnnualFee = contract.base_annual_fee?.value || 0
  const baseMonthlyFee = contract.base_monthly_fee?.value || 0
  
  // Scenario A Math
  const ldRate = contract.ld_rate_per_pp?.value || 0
  const ldCapPct = contract.ld_cap_pct?.value || 15
  const ldCapValue = (baseAnnualFee * ldCapPct) / 100
  const shortfall = Math.max(0, guarantee - availability)
  const rawLdExposure = (baseAnnualFee * (shortfall * ldRate)) / 100
  const actualLdExposure = Math.min(rawLdExposure, ldCapValue)

  // Scenario B Math
  const newMonthlyFee = baseMonthlyFee * (1 + wpiIncrease / 100)
  const annualImpact = (newMonthlyFee - baseMonthlyFee) * 12
  
  // Compounded impact over term (assuming uniform increase each year)
  let compoundedTotal = 0
  let currentFee = baseAnnualFee
  for (let i = 1; i <= termYears; i++) {
    currentFee = currentFee * (1 + wpiIncrease / 100)
    compoundedTotal += (currentFee - baseAnnualFee)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SCENARIO A */}
      <div className="bg-[--color-wolvio-surface] rounded-[12px] border border-[--color-wolvio-slate] shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="px-6 py-4 bg-[--color-wolvio-navy] border-b border-[--color-wolvio-slate] flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-[--color-wolvio-light]">Scenario A — Availability Drop</h3>
          <span className="px-2.5 py-1 bg-red-500/20 text-[#EF4444] text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-500/30">
            Risk Analysis
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider text-[--color-wolvio-mid] mb-4 block">
                If availability drops to {availability}%
              </label>
              <input 
                type="range" 
                min="90" 
                max="96" 
                step="0.5" 
                value={availability}
                onChange={(e) => setAvailability(parseFloat(e.target.value))}
                className="w-full accent-[--color-wolvio-orange]"
              />
              <div className="flex justify-between text-xs text-[--color-wolvio-slate] mt-2 font-mono">
                <span>90%</span>
                <span>96% (Guarantee: {guarantee}%)</span>
              </div>
            </div>

            <div className="bg-[--color-wolvio-dark] p-4 rounded-lg border border-[--color-wolvio-slate]">
              <div className="text-sm text-[--color-wolvio-mid] mb-2 font-mono">Contract Parameters</div>
              <div className="text-sm text-[--color-wolvio-light] leading-relaxed">
                <span className="text-[--color-wolvio-orange] font-semibold">{contract.ld_rate_per_pp?.clause_reference || 'Clause'}</span> · {ldRate}% per pp shortfall
                <br/>
                <span className="text-[--color-wolvio-orange] font-semibold">{contract.ld_cap_pct?.clause_reference || 'Clause'}</span> · Cap: {ldCapPct}% of annual fee ({formatINRShort(ldCapValue)})
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center text-center bg-red-500/5 rounded-[12px] border border-red-500/20 p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EF4444]" />
            <div className="text-sm font-semibold uppercase tracking-widest text-[#EF4444] mb-2">Annual LD Exposure</div>
            <div className="font-mono text-4xl font-extrabold text-[#EF4444] tracking-tight mb-2">
              {formatINRShort(actualLdExposure)}
            </div>
            <div className="text-sm text-[#EF4444]/80 font-medium">
              At {availability}% availability ({shortfall.toFixed(1)}% shortfall)
            </div>
            {actualLdExposure === ldCapValue && (
              <div className="mt-3 px-3 py-1 bg-red-500/20 text-[#EF4444] text-xs font-bold rounded-full border border-red-500/30">
                CAP REACHED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCENARIO B */}
      <div className="bg-[--color-wolvio-surface] rounded-[12px] border border-[--color-wolvio-slate] shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="px-6 py-4 bg-[--color-wolvio-navy] border-b border-[--color-wolvio-slate] flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-[--color-wolvio-light]">Scenario B — Escalation Impact</h3>
          <span className="px-2.5 py-1 bg-amber-500/20 text-[#F59E0B] text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/30">
            Financial Forecast
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider text-[--color-wolvio-mid] mb-4 block">
                If WPI increases by {wpiIncrease}% annually
              </label>
              <input 
                type="range" 
                min="1" 
                max="8" 
                step="0.5" 
                value={wpiIncrease}
                onChange={(e) => setWpiIncrease(parseFloat(e.target.value))}
                className="w-full accent-[--color-wolvio-orange]"
              />
              <div className="flex justify-between text-xs text-[--color-wolvio-slate] mt-2 font-mono">
                <span>1%</span>
                <span>8%</span>
              </div>
            </div>

            <div className="bg-[--color-wolvio-dark] p-4 rounded-lg border border-[--color-wolvio-slate]">
              <div className="text-sm text-[--color-wolvio-mid] mb-2 font-mono">Baseline Values</div>
              <div className="text-sm text-[--color-wolvio-light] leading-relaxed">
                Current Monthly Fee: <span className="font-mono font-bold text-white">{formatINRShort(baseMonthlyFee)}</span>
                <br/>
                Current Annual Fee: <span className="font-mono font-bold text-white">{formatINRShort(baseAnnualFee)}</span>
                <br/>
                Remaining Term: <span className="font-bold text-white">{termYears} years</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-4 bg-amber-500/5 rounded-[12px] border border-amber-500/20 p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F59E0B]" />
            
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B] mb-1">New Monthly Fee (Year 2)</div>
              <div className="font-mono text-2xl font-bold text-[#F59E0B]">{formatINRShort(newMonthlyFee)}</div>
            </div>
            
            <div className="pt-3 border-t border-amber-500/20">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B] mb-1">Impact (Year 2)</div>
              <div className="font-mono text-2xl font-bold text-[#F59E0B]">+{formatINRShort(annualImpact)}</div>
            </div>

            <div className="pt-3 border-t border-amber-500/20">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B] mb-1">Compounded over {termYears} years</div>
              <div className="font-mono text-2xl font-bold text-[#F59E0B]">+{formatINRShort(compoundedTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
