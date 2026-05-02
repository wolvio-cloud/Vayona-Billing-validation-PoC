import { getDemoContractParameters } from '@/lib/demo-data'
import { ContractHeader } from '@/components/contract/ContractHeader'
import { ParameterField } from '@/components/contract/ParameterField'
import { ValidationWarnings } from '@/components/contract/ValidationWarnings'
import { ExtractionQualityScore } from '@/components/contract/ExtractionQualityScore'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mt-12 mb-6">
      <h3 className="font-heading font-bold text-lg text-[--color-wolvio-light] whitespace-nowrap">{title}</h3>
      <Separator className="flex-1 bg-[--color-wolvio-slate]" />
    </div>
  )
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contract = await getDemoContractParameters(id)

  if (!contract) return notFound()

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-10 px-6 pb-24">
      <ContractHeader 
        displayName="Wind Farm Alpha LTSA" 
        isDemo={true} 
        annualFee={contract.base_annual_fee.value} 
        termYears={15} 
        counterparty="GreenWind Power" 
      />

      <ValidationWarnings warnings={contract.validation_warnings || []} />
      
      <ExtractionQualityScore contract={contract} />

      <div>
        <SectionHeader title="Commercial Terms" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParameterField label="Base Monthly Fee" value={`₹${contract.base_monthly_fee.value?.toLocaleString('en-IN')}`} clauseReference={contract.base_monthly_fee.clause_reference} pageNumber={contract.base_monthly_fee.page_number} sourceClause={contract.base_monthly_fee.source_clause} confidence={contract.base_monthly_fee.confidence} />
          <ParameterField label="Base Annual Fee" value={`₹${contract.base_annual_fee.value?.toLocaleString('en-IN')}`} clauseReference={contract.base_annual_fee.clause_reference} pageNumber={contract.base_annual_fee.page_number} sourceClause={contract.base_annual_fee.source_clause} confidence={contract.base_annual_fee.confidence} />
          {contract.variable_component && (
            <ParameterField label="Variable Rate" value={`₹${contract.variable_component.value?.rate_per_kwh}/kWh`} clauseReference={contract.variable_component.clause_reference} pageNumber={contract.variable_component.page_number} sourceClause={contract.variable_component.source_clause} confidence={contract.variable_component.confidence} />
          )}
          <ParameterField label="Payment Terms" value={`Net ${contract.payment_terms_days.value} days`} clauseReference={contract.payment_terms_days.clause_reference} pageNumber={contract.payment_terms_days.page_number} sourceClause={contract.payment_terms_days.source_clause} confidence={contract.payment_terms_days.confidence} />
        </div>

        {contract.escalation && (
          <>
            <SectionHeader title="Escalation" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParameterField label="Escalation Type" value={`${contract.escalation.value?.type} Index`} clauseReference={contract.escalation.clause_reference} pageNumber={contract.escalation.page_number} sourceClause={contract.escalation.source_clause} confidence={contract.escalation.confidence} />
              <ParameterField label="Base Month" value={contract.escalation.value?.index_base_month || ''} clauseReference={contract.escalation.clause_reference} pageNumber={contract.escalation.page_number} sourceClause={contract.escalation.source_clause} confidence={contract.escalation.confidence} />
              <ParameterField label="Effective Date" value={contract.escalation.value?.effective_date || ''} clauseReference={contract.escalation.clause_reference} pageNumber={contract.escalation.page_number} sourceClause={contract.escalation.source_clause} confidence={contract.escalation.confidence} />
              <ParameterField label="Annual Cap" value={`${contract.escalation.value?.cap_pct}%`} clauseReference={contract.escalation.clause_reference} pageNumber={contract.escalation.page_number} sourceClause={contract.escalation.source_clause} confidence={contract.escalation.confidence} />
            </div>
          </>
        )}

        <SectionHeader title="Performance" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParameterField label="Guaranteed Availability" value={`${contract.availability_guarantee_pct.value}%`} clauseReference={contract.availability_guarantee_pct.clause_reference} pageNumber={contract.availability_guarantee_pct.page_number} sourceClause={contract.availability_guarantee_pct.source_clause} confidence={contract.availability_guarantee_pct.confidence} />
          {contract.bonus_threshold_pct && contract.bonus_rate_per_pp && (
            <ParameterField label="Bonus Threshold & Rate" value={`Above ${contract.bonus_threshold_pct.value}% · ${contract.bonus_rate_per_pp.value}% / pp`} clauseReference={contract.bonus_threshold_pct.clause_reference} pageNumber={contract.bonus_threshold_pct.page_number} sourceClause={contract.bonus_threshold_pct.source_clause} confidence={contract.bonus_threshold_pct.confidence} />
          )}
        </div>

        <SectionHeader title="Penalties" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParameterField label="LD Rate" value={`${contract.ld_rate_per_pp.value}% per pp shortfall`} clauseReference={contract.ld_rate_per_pp.clause_reference} pageNumber={contract.ld_rate_per_pp.page_number} sourceClause={contract.ld_rate_per_pp.source_clause} confidence={contract.ld_rate_per_pp.confidence} />
          <ParameterField label="LD Annual Cap" value={`${contract.ld_cap_pct.value}% of Annual Fee`} clauseReference={contract.ld_cap_pct.clause_reference} pageNumber={contract.ld_cap_pct.page_number} sourceClause={contract.ld_cap_pct.source_clause} confidence={contract.ld_cap_pct.confidence} />
        </div>
      </div>

      <div className="mt-12 w-full pt-8">
        <Button asChild className="w-full bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white py-8 text-lg font-bold shadow-md rounded-[12px] transition-all hover:shadow-lg hover:-translate-y-1">
          <Link href={`/contracts/${id}/validate`}>Validate Invoice →</Link>
        </Button>
      </div>
    </div>
  )
}
