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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-slate-900">Scenario A — Availability Drop</h3>
          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-100">
            Risk Analysis
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 block">
                If availability drops to {availability}%
              </label>
              <input 
                type="range" 
                min="90" 
                max="96" 
                step="0.5" 
                value={availability}
                onChange={(e) => setAvailability(parseFloat(e.target.value))}
                className="w-full accent-wolvio-orange"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                <span>90%</span>
                <span>96% (Guarantee: {guarantee}%)</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Contract Parameters</div>
              <div className="text-sm text-slate-500 leading-relaxed">
                <span className="text-wolvio-orange font-bold">{contract.ld_rate_per_pp?.clause_reference || 'Clause'}</span> · {ldRate}% per pp shortfall
                <br/>
                <span className="text-wolvio-orange font-bold">{contract.ld_cap_pct?.clause_reference || 'Clause'}</span> · Cap: {ldCapPct}% ({formatINRShort(ldCapValue)})
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center text-center bg-red-50 rounded-xl border border-red-100 p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Annual Exposure</div>
            <div className="font-mono text-3xl font-bold text-red-600 tracking-tight mb-1">
              {formatINRShort(actualLdExposure)}
            </div>
            <div className="text-[10px] text-red-600/60 font-bold uppercase tracking-widest">
              At {availability}% availability
            </div>
            {actualLdExposure === ldCapValue && (
              <div className="mt-3 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg border border-red-200">
                CAP REACHED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCENARIO B */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-slate-900">Scenario B — Escalation Impact</h3>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-amber-100">
            Financial Forecast
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 block">
                If WPI increases by {wpiIncrease}% annually
              </label>
              <input 
                type="range" 
                min="1" 
                max="8" 
                step="0.5" 
                value={wpiIncrease}
                onChange={(e) => setWpiIncrease(parseFloat(e.target.value))}
                className="w-full accent-wolvio-orange"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                <span>1%</span>
                <span>8%</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Baseline Values</div>
              <div className="text-sm text-slate-500 leading-relaxed">
                Current Monthly: <span className="font-mono font-bold text-slate-900">{formatINRShort(baseMonthlyFee)}</span>
                <br/>
                Current Annual: <span className="font-mono font-bold text-slate-900">{formatINRShort(baseAnnualFee)}</span>
                <br/>
                Remaining Term: <span className="font-bold text-slate-900">{termYears} years</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-4 bg-amber-50 rounded-xl border border-amber-100 p-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-600" />
            
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Impact (Year 2)</div>
              <div className="font-mono text-2xl font-bold text-amber-600">+{formatINRShort(annualImpact)}</div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Term Cumulative</div>
              <div className="font-mono text-2xl font-bold text-amber-600">+{formatINRShort(compoundedTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
