import { getDemoContractParameters } from '@/lib/demo-data'
import { ContractHeader } from '@/components/contract/ContractHeader'
import { ValidationWarnings } from '@/components/contract/ValidationWarnings'
import { ExtractionQualityScore } from '@/components/contract/ExtractionQualityScore'
import { notFound } from 'next/navigation'
import sql from '@/lib/db'
import { ContractParameters } from '@/lib/schemas/contract'
import { ContractDetailClient } from '@/components/contract/ContractDetailClient'

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  let contract: ContractParameters | null = null
  
  if (id.startsWith('C')) {
    // Check if it's the demo contract C001
    if (id === 'C001') {
      contract = await getDemoContractParameters(id)
    } else {
      // Fetch from DB
      const [row] = await sql`SELECT parameters FROM contracts WHERE contract_id = ${id} LIMIT 1`
      if (row && row.parameters) {
        contract = row.parameters as unknown as ContractParameters
      }
    }
  }

  if (!contract) return notFound()

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-10 px-6 pb-24">
      <ContractHeader 
        displayName={id === 'C001' ? "Wind Farm Alpha LTSA" : "Extracted Contract"} 
        isDemo={id === 'C001'} 
        annualFee={contract.base_annual_fee.value} 
        termYears={15} 
        counterparty="GreenWind Power" 
      />

      <ValidationWarnings warnings={contract.validation_warnings || []} />
      
      <ExtractionQualityScore contract={contract} />

      <ContractDetailClient initialContract={contract} contractId={id} />
    </div>
  )
}

