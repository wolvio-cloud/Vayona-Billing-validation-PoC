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
    if (id === 'C001') {
      contract = await getDemoContractParameters(id)
    } else {
      const [row] = await sql`SELECT parameters FROM contracts WHERE contract_id = ${id} LIMIT 1`
      if (row && row.parameters) {
        contract = row.parameters as unknown as ContractParameters
      }
    }
  }

  if (!contract) return notFound()

  return (
    <div className="max-w-7xl mx-auto py-16 px-8 space-y-12">
      <div className="animate-fade-in-up">
        <ValidationWarnings warnings={contract.validation_warnings || []} />
        <ExtractionQualityScore contract={contract} />
      </div>

      <ContractDetailClient 
        initialContract={contract} 
        contractId={id} 
      />
    </div>
  )
}


