import { getDemoContractParameters } from '@/lib/demo-data'
import { ContractHeader } from '@/components/contract/ContractHeader'
import { ParameterField } from '@/components/contract/ParameterField'
import { ValidationWarnings } from '@/components/contract/ValidationWarnings'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contract = await getDemoContractParameters(id)

  if (!contract) return notFound()

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8 px-4">
      <ContractHeader 
        displayName="Wind Farm Alpha LTSA" 
        isDemo={true} 
        annualFee={contract.base_annual_fee.value} 
        termYears={15} 
        counterparty="GreenWind Power" 
      />

      <ValidationWarnings warnings={contract.validation_warnings || []} />

      <div className="rounded-xl border border-[--color-border] bg-white overflow-hidden shadow-sm">
        <div className="p-0">
          <ParameterField label="Base Fee" value={`₹${(contract.base_monthly_fee.value / 100000).toFixed(2)} L/month`} clauseReference={contract.base_monthly_fee.clause_reference} pageNumber={contract.base_monthly_fee.page_number} sourceClause={contract.base_monthly_fee.source_clause} confidence={contract.base_monthly_fee.confidence} />
          
          {contract.escalation && (
            <ParameterField label="Escalation" value={`${contract.escalation.value.type} · ${contract.escalation.value.effective_date} · Cap ${contract.escalation.value.cap_pct}%`} clauseReference={contract.escalation.clause_reference} pageNumber={contract.escalation.page_number} sourceClause={contract.escalation.source_clause} confidence={contract.escalation.confidence} />
          )}

          {contract.variable_component && (
            <ParameterField label="Variable" value={`₹${contract.variable_component.value.rate_per_kwh}/kWh · ${contract.variable_component.value.billing_frequency}`} clauseReference={contract.variable_component.clause_reference} pageNumber={contract.variable_component.page_number} sourceClause={contract.variable_component.source_clause} confidence={contract.variable_component.confidence} />
          )}

          <ParameterField label="Guarantee" value={`${contract.availability_guarantee_pct.value.toFixed(1)}% availability`} clauseReference={contract.availability_guarantee_pct.clause_reference} pageNumber={contract.availability_guarantee_pct.page_number} sourceClause={contract.availability_guarantee_pct.source_clause} confidence={contract.availability_guarantee_pct.confidence} />
          <ParameterField label="LD" value={`${contract.ld_rate_per_pp.value}% per pp · Cap ${contract.ld_cap_pct.value}%`} clauseReference={contract.ld_rate_per_pp.clause_reference} pageNumber={contract.ld_rate_per_pp.page_number} sourceClause={contract.ld_rate_per_pp.source_clause} confidence={contract.ld_rate_per_pp.confidence} />
          
          {contract.bonus_threshold_pct && contract.bonus_rate_per_pp && (
            <ParameterField label="Bonus" value={`${contract.bonus_rate_per_pp.value}% per pp above ${contract.bonus_threshold_pct.value}%`} clauseReference={contract.bonus_threshold_pct.clause_reference} pageNumber={contract.bonus_threshold_pct.page_number} sourceClause={contract.bonus_threshold_pct.source_clause} confidence={contract.bonus_threshold_pct.confidence} />
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button asChild size="lg" className="bg-[--color-wolvio-navy] text-white hover:bg-[--color-wolvio-dark]">
          <Link href={`/contracts/${id}/validate`}>Validate Invoice →</Link>
        </Button>
      </div>
    </div>
  )
}
