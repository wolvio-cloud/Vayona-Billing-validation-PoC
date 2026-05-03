'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContractParameters } from '@/lib/schemas/contract'
import { ParameterField } from './ParameterField'
import { Button } from '@/components/ui/button'
import { 
  ShieldCheck, 
  FileText, 
  LayoutGrid, 
  ArrowRight, 
  AlertCircle,
  TrendingUp,
  Cpu,
  BarChart3
} from 'lucide-react'

interface ContractDetailClientProps {
  initialContract: ContractParameters
  contractId: string
}

export function ContractDetailClient({ initialContract, contractId }: ContractDetailClientProps) {
  const [contract, setContract] = useState(initialContract)
  const router = useRouter()

  const handleManualValue = (key: string, val: any) => {
    setContract(prev => ({
      ...prev,
      [key]: {
        ...(prev as any)[key],
        value: val,
        confidence: 'manual_input'
      }
    }))
  }

  const fields = Object.entries(contract).filter(([_, v]) => v && typeof v === 'object' && 'value' in v)
  const foundCount = fields.filter(([_, v]) => (v as any).value !== null).length
  const totalCount = fields.length

  return (
    <div className="space-y-24 pb-40">
      {/* Hero Header Section */}
      <GlassCard className="p-16 border-none shadow-[0_60px_100px_-20px_rgba(0,0,0,0.7)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[--color-wolvio-orange]/20 via-transparent to-blue-600/10 pointer-events-none transition-all duration-1000 group-hover:opacity-100" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="space-y-8 flex-1">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[--color-wolvio-orange] text-[10px] font-black tracking-[0.3em] uppercase">
                {contract.contract_type || 'LTSA'} · ID: {contractId}
              </div>
              <div className="flex items-center gap-2 text-[--color-wolvio-green] text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={14} /> Extraction Validated
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-heading font-black text-white tracking-tighter leading-none">
              {(contract as any).display_name || 'Service Agreement'}
            </h1>

            <div className="flex flex-wrap items-center gap-10">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Annual Commitment</div>
                <div className="text-2xl font-mono font-black text-white tracking-tighter">
                  {contract.base_annual_fee?.value ? `₹${(contract.base_annual_fee.value / 10000000).toFixed(2)} Cr` : 'N/A'}
                </div>
              </div>
              <div className="w-[1px] h-10 bg-white/10 hidden md:block" />
              <div className="space-y-1">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Data Fidelity</div>
                <div className="text-2xl font-mono font-black text-[--color-wolvio-green] tracking-tighter">
                  {Math.round((foundCount / totalCount) * 100)}%
                </div>
              </div>
              <div className="w-[1px] h-10 bg-white/10 hidden md:block" />
              <div className="space-y-1">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">System Status</div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[--color-wolvio-orange] animate-ping" />
                   <div className="text-sm font-black text-white uppercase tracking-widest">Active Engine</div>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => router.push(`/contracts/${contractId}/validate`)}
            className="bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white px-16 py-12 rounded-[32px] text-2xl font-black shadow-[0_30px_60px_-15px_rgba(242,102,48,0.5)] group transition-all hover:scale-105 active:scale-95"
          >
            Start Audit <ArrowRight className="ml-6 w-8 h-8 group-hover:translate-x-4 transition-transform" />
          </Button>
        </div>
      </GlassCard>

      {/* Main Parameters Display */}
      <div className="grid grid-cols-1 gap-32">
        {/* CATEGORY: COMMERCIAL */}
        <section className="space-y-12">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-blue-500/10 rounded-[24px] flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <BarChart3 className="text-blue-400" size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-black text-white tracking-tight uppercase">Commercial Baseline</h2>
              <p className="text-sm font-bold text-[--color-wolvio-mid] uppercase tracking-widest">Fixed and Variable Fee Structures</p>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <ParameterField 
              label="Base Annual Fee" 
              value={contract.base_annual_fee?.value?.toLocaleString('en-IN') || null} 
              clauseReference={contract.base_annual_fee?.clause_reference || 'Clause 8.1'} 
              pageNumber={contract.base_annual_fee?.page_number || 1} 
              sourceClause={contract.base_annual_fee?.source_clause || ''} 
              confidence={contract.base_annual_fee?.confidence}
              onManualValue={(v) => handleManualValue('base_annual_fee', parseFloat(v))}
            />
            <ParameterField 
              label="Base Monthly Fee" 
              value={contract.base_monthly_fee?.value?.toLocaleString('en-IN') || null} 
              clauseReference={contract.base_monthly_fee?.clause_reference || 'Clause 8.1'} 
              pageNumber={contract.base_monthly_fee?.page_number || 1} 
              sourceClause={contract.base_monthly_fee?.source_clause || ''} 
              confidence={contract.base_monthly_fee?.confidence}
              onManualValue={(v) => handleManualValue('base_monthly_fee', parseFloat(v))}
            />
            <ParameterField 
              label="Variable Rate (per kWh)" 
              value={contract.variable_component?.value?.rate_per_kwh ? `₹${contract.variable_component.value.rate_per_kwh}` : null} 
              clauseReference={contract.variable_component?.clause_reference || 'Schedule 3'} 
              pageNumber={contract.variable_component?.page_number || 45} 
              sourceClause={contract.variable_component?.source_clause || ''} 
              confidence={contract.variable_component?.confidence}
              onManualValue={(v) => handleManualValue('variable_component', { ...contract.variable_component?.value, rate_per_kwh: parseFloat(v) })}
            />
          </div>
        </section>

        {/* CATEGORY: ESCALATION */}
        <section className="space-y-12">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-purple-500/10 rounded-[24px] flex items-center justify-center border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <TrendingUp className="text-purple-400" size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-black text-white tracking-tight uppercase">Indexation & Escalation</h2>
              <p className="text-sm font-bold text-[--color-wolvio-mid] uppercase tracking-widest">Inflation Adjustments & Cap Mechanisms</p>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <ParameterField 
              label="Indexation Type" 
              value={contract.escalation?.value?.type || null} 
              clauseReference={contract.escalation?.clause_reference || 'Clause 8.2'} 
              pageNumber={contract.escalation?.page_number || 12} 
              sourceClause={contract.escalation?.source_clause || ''} 
              confidence={contract.escalation?.confidence}
            />
            <ParameterField 
              label="Escalation Cap (p.a.)" 
              value={contract.escalation?.value?.cap_pct ? `${contract.escalation.value.cap_pct}%` : null} 
              clauseReference={contract.escalation?.clause_reference || 'Clause 8.2.1'} 
              pageNumber={contract.escalation?.page_number || 12} 
              sourceClause={contract.escalation?.source_clause || ''} 
              confidence={contract.escalation?.confidence}
            />
            <ParameterField 
              label="Effective Date" 
              value={contract.escalation?.value?.effective_date || null} 
              clauseReference={contract.escalation?.clause_reference || 'Clause 8.2'} 
              pageNumber={contract.escalation?.page_number || 12} 
              sourceClause={contract.escalation?.source_clause || ''} 
              confidence={contract.escalation?.confidence}
            />
          </div>
        </section>

        {/* CATEGORY: PERFORMANCE */}
        <section className="space-y-12">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-[24px] flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <Cpu className="text-green-400" size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-black text-white tracking-tight uppercase">Performance & Risk</h2>
              <p className="text-sm font-bold text-[--color-wolvio-mid] uppercase tracking-widest">Guarantees, LDs and Penalties</p>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <ParameterField 
              label="Availability Guarantee" 
              value={contract.availability_guarantee_pct?.value ? `${contract.availability_guarantee_pct.value}%` : null} 
              clauseReference={contract.availability_guarantee_pct?.clause_reference || 'Clause 12.1'} 
              pageNumber={contract.availability_guarantee_pct?.page_number || 35} 
              sourceClause={contract.availability_guarantee_pct?.source_clause || ''} 
              confidence={contract.availability_guarantee_pct?.confidence}
            />
            <ParameterField 
              label="LD Rate (per PP)" 
              value={contract.ld_rate_per_pp?.value ? `${contract.ld_rate_per_pp.value}% of Annual Fee` : null} 
              clauseReference={contract.ld_rate_per_pp?.clause_reference || 'Clause 12.2'} 
              pageNumber={contract.ld_rate_per_pp?.page_number || 36} 
              sourceClause={contract.ld_rate_per_pp?.source_clause || ''} 
              confidence={contract.ld_rate_per_pp?.confidence}
            />
            <ParameterField 
              label="Bonus Threshold" 
              value={contract.bonus_threshold_pct?.value ? `${contract.bonus_threshold_pct.value}%` : null} 
              clauseReference={contract.bonus_threshold_pct?.clause_reference || 'Clause 12.4'} 
              pageNumber={contract.bonus_threshold_pct?.page_number || 38} 
              sourceClause={contract.bonus_threshold_pct?.source_clause || ''} 
              confidence={contract.bonus_threshold_pct?.confidence}
            />
          </div>
        </section>

        {/* CATEGORY: LEGAL & ADMIN */}
        <section className="space-y-12 pb-20">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-[24px] flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <FileText className="text-amber-400" size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-black text-white tracking-tight uppercase">Administrative & Legal</h2>
              <p className="text-sm font-bold text-[--color-wolvio-mid] uppercase tracking-widest">Payment Terms, Interest & Renewal</p>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <ParameterField 
              label="Payment Cycle" 
              value={contract.payment_terms_days?.value ? `Net ${contract.payment_terms_days.value} Days` : null} 
              clauseReference={contract.payment_terms_days?.clause_reference || 'Clause 8.4'} 
              pageNumber={contract.payment_terms_days?.page_number || 15} 
              sourceClause={contract.payment_terms_days?.source_clause || ''} 
              confidence={contract.payment_terms_days?.confidence}
            />
            <ParameterField 
              label="Late Payment Interest" 
              value={contract.late_payment_interest?.value || null} 
              clauseReference={contract.late_payment_interest?.clause_reference || 'Clause 8.5'} 
              pageNumber={contract.late_payment_interest?.page_number || 16} 
              sourceClause={contract.late_payment_interest?.source_clause || ''} 
              confidence={contract.late_payment_interest?.confidence}
            />
            <ParameterField 
              label="Renewal Notice" 
              value={contract.renewal_notice_months?.value ? `${contract.renewal_notice_months.value} Months` : null} 
              clauseReference={contract.renewal_notice_months?.clause_reference || 'Clause 2.2'} 
              pageNumber={contract.renewal_notice_months?.page_number || 3} 
              sourceClause={contract.renewal_notice_months?.source_clause || ''} 
              confidence={contract.renewal_notice_months?.confidence}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

  )
}
