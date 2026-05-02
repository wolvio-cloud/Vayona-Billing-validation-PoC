'use client'

import { useState } from 'react'
import { ContractParameters } from '@/lib/schemas/contract'
import { ParameterField } from './ParameterField'
import { SectionHeader } from './SectionHeader'
import { ContractTabs } from './ContractTabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface ContractDetailClientProps {
  initialContract: ContractParameters
  contractId: string
}

export function ContractDetailClient({ initialContract, contractId }: ContractDetailClientProps) {
  const [contract, setContract] = useState(initialContract)

  const handleManualValue = (key: keyof ContractParameters, val: string) => {
    setContract(prev => {
      const field = (prev as any)[key]
      if (!field) return prev
      return {
        ...prev,
        [key]: {
          ...field,
          value: val,
          confidence: 'manual_input'
        }
      }
    })
  }

  const foundCount = Object.values(contract).filter(v => v && typeof v === 'object' && 'value' in v && v.value !== null).length
  const totalCount = 12 // Adjust based on schema
  const missingCount = totalCount - foundCount

  return (
    <div className="space-y-6">
      {contract.extraction_warnings && contract.extraction_warnings.length > 0 && (
        <div className="space-y-3">
          {contract.extraction_warnings.map((warning, i) => (
            <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-2 bg-red-500/20 rounded-full">
                <AlertCircle className="text-[#EF4444]" size={20} />
              </div>
              <p className="text-sm font-medium text-[--color-wolvio-light]">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {missingCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-[12px] p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-2 bg-amber-500/20 rounded-full">
            <AlertCircle className="text-[#F59E0B]" size={20} />
          </div>
          <p className="text-sm font-medium text-[--color-wolvio-light]">
            <span className="text-[#F59E0B] font-bold">{foundCount} of {totalCount} parameters extracted</span> — {missingCount} require manual input or are absent from this document.
          </p>
        </div>
      )}

      <ContractTabs contract={contract} termYears={15}>
        <div className="space-y-6">
          <div>
            <SectionHeader title="Commercial Terms" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParameterField 
                label="Base Monthly Fee" 
                value={contract.base_monthly_fee.value?.toLocaleString('en-IN') || null} 
                clauseReference={contract.base_monthly_fee.clause_reference} 
                pageNumber={contract.base_monthly_fee.page_number} 
                sourceClause={contract.base_monthly_fee.source_clause} 
                confidence={contract.base_monthly_fee.confidence as any}
                onManualValue={(v) => handleManualValue('base_monthly_fee', v)}
              />
              <ParameterField 
                label="Base Annual Fee" 
                value={contract.base_annual_fee.value?.toLocaleString('en-IN') || null} 
                clauseReference={contract.base_annual_fee.clause_reference} 
                pageNumber={contract.base_annual_fee.page_number} 
                sourceClause={contract.base_annual_fee.source_clause} 
                confidence={contract.base_annual_fee.confidence as any}
                onManualValue={(v) => handleManualValue('base_annual_fee', v)}
              />
              <ParameterField 
                label="Payment Terms" 
                value={contract.payment_terms_days.value ? `Net ${contract.payment_terms_days.value} days` : null} 
                clauseReference={contract.payment_terms_days.clause_reference} 
                pageNumber={contract.payment_terms_days.page_number} 
                sourceClause={contract.payment_terms_days.source_clause} 
                confidence={contract.payment_terms_days.confidence as any}
                onManualValue={(v) => handleManualValue('payment_terms_days', v)}
              />
            </div>

            <SectionHeader title="Escalation" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParameterField 
                label="Escalation Type" 
                value={contract.escalation?.value?.type ? `${contract.escalation.value.type} Index` : null} 
                clauseReference={contract.escalation?.clause_reference || 'N/A'} 
                pageNumber={contract.escalation?.page_number || 0} 
                sourceClause={contract.escalation?.source_clause || ''} 
                confidence={contract.escalation?.confidence as any}
                onManualValue={(v) => handleManualValue('escalation', v)}
              />
              <ParameterField 
                label="Annual Cap" 
                value={contract.escalation?.value?.cap_pct ? `${contract.escalation.value.cap_pct}%` : null} 
                clauseReference={contract.escalation?.clause_reference || 'N/A'} 
                pageNumber={contract.escalation?.page_number || 0} 
                sourceClause={contract.escalation?.source_clause || ''} 
                confidence={contract.escalation?.confidence as any}
              />
            </div>

            <SectionHeader title="Performance" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParameterField 
                label="Guaranteed Availability" 
                value={contract.availability_guarantee_pct.value ? `${contract.availability_guarantee_pct.value}%` : null} 
                clauseReference={contract.availability_guarantee_pct.clause_reference} 
                pageNumber={contract.availability_guarantee_pct.page_number} 
                sourceClause={contract.availability_guarantee_pct.source_clause} 
                confidence={contract.availability_guarantee_pct.confidence as any}
                onManualValue={(v) => handleManualValue('availability_guarantee_pct', v)}
              />
            </div>

            <SectionHeader title="Penalties" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParameterField 
                label="LD Rate" 
                value={contract.ld_rate_per_pp.value ? `${contract.ld_rate_per_pp.value}% per pp shortfall` : null} 
                clauseReference={contract.ld_rate_per_pp.clause_reference} 
                pageNumber={contract.ld_rate_per_pp.page_number} 
                sourceClause={contract.ld_rate_per_pp.source_clause} 
                confidence={contract.ld_rate_per_pp.confidence as any}
                onManualValue={(v) => handleManualValue('ld_rate_per_pp', v)}
              />
            </div>
          </div>

          <div className="mt-12 w-full pt-8">
            <Button asChild className="w-full bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white py-8 text-lg font-bold shadow-md rounded-[12px] transition-all hover:shadow-lg hover:-translate-y-1">
              <Link href={`/contracts/${contractId}/validate`}>Validate Invoice →</Link>
            </Button>
          </div>
        </div>
      </ContractTabs>
    </div>
  )
}
