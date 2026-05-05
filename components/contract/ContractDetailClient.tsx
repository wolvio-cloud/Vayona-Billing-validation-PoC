'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContractParameters } from '@/lib/schemas/contract'
import { ParameterField } from './ParameterField'
import { ContractSimulator } from './ContractSimulator'
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

import { QuickFixModal } from './QuickFixModal'

interface ContractDetailClientProps {
  initialContract: ContractParameters
  contractId: string
  displayName: string
}

export function ContractDetailClient({ initialContract, contractId, displayName }: ContractDetailClientProps) {
  const [contract, setContract] = useState(initialContract)
  const [showQuickFix, setShowQuickFix] = useState(false)
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
      <div className="bg-white rounded-2xl p-12 border border-slate-200 relative overflow-hidden shadow-sm">
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="space-y-8 flex-1">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-wolvio-orange text-[10px] font-black tracking-[0.3em] uppercase">
                {contract.contract_type || 'LTSA'} · ID: {contractId}
              </div>
              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={14} /> Extraction Validated
              </div>
            </div>

            <h1 className="text-6xl md:text-5xl font-heading font-black text-slate-900 tracking-tighter leading-tight max-w-3xl break-words">
              {displayName}
            </h1>

            <div className="flex flex-wrap items-center gap-10">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Annual Commitment</div>
                <div className="text-2xl font-mono font-black text-slate-900 tracking-tighter">
                  {contract.base_annual_fee?.value ? `₹${(contract.base_annual_fee.value / 10000000).toFixed(2)} Cr` : 'N/A'}
                </div>
              </div>
              <div className="w-[1px] h-10 bg-slate-200 hidden md:block" />
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Data Fidelity</div>
                <div className="text-2xl font-mono font-black text-emerald-600 tracking-tighter">
                  {totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0}%
                </div>
              </div>
              <div className="w-[1px] h-10 bg-slate-200 hidden md:block" />
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-wolvio-orange" />
                   <div className="text-xs font-bold text-slate-900 uppercase tracking-widest">Active Engine</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 shrink-0 lg:w-72">
            <Button 
              onClick={() => {
                window.scrollTo(0, 0)
                router.push(`/contracts/${contractId}/validate`)
              }}
              className="bg-wolvio-orange hover:bg-orange-700 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-lg transition-all"
            >
              Start Audit <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowQuickFix(true)}
              className="bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Manual Override
            </Button>
          </div>
        </div>
      </div>

      <QuickFixModal 
        isOpen={showQuickFix}
        onClose={() => setShowQuickFix(false)}
        parameters={contract}
        onSave={(updated) => setContract(updated)}
      />

      {/* Main Parameters Display */}
      <div className="grid grid-cols-1 gap-32">
        {/* CATEGORY: COMMERCIAL */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight uppercase">Commercial Baseline</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Fixed and Variable Fee Structures</p>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200" />
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
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight uppercase">Indexation & Escalation</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Inflation Adjustments & Cap Mechanisms</p>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200" />
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
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <Cpu className="text-emerald-600" size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight uppercase">Performance & Risk</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Guarantees, LDs and Penalties</p>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200" />
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
        <section className="space-y-8 pb-10">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
              <FileText className="text-amber-600" size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-bold text-slate-900 tracking-tight uppercase">Administrative & Legal</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Payment Terms & Interest</p>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200" />
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

        {/* CATEGORY: PREDICTIVE FORECASTING */}
        <section className="space-y-8 pb-20">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
              <TrendingUp className="text-red-600" size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-bold text-slate-900 tracking-tight uppercase">Financial Modeling</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Simulate Exposure & Risk</p>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200" />
          </div>
          <ContractSimulator contract={contract} termYears={(contract as any).termYears || 15} />
        </section>
      </div>
    </div>
  )
}
