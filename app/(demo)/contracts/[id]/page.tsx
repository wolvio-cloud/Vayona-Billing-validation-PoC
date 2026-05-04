import { getDemoContractParameters } from '@/lib/demo-data'
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
  
  // Try demo JSON files first (C001–C008 all have JSON files)
  if (id.startsWith('C')) {
    contract = await getDemoContractParameters(id)
  }

  // If not found in demo data, check database / mockStore (for uploaded contracts)
  if (!contract) {
    try {
      const [row] = await sql`SELECT parameters FROM contracts WHERE contract_id = ${id} LIMIT 1`
      if (row?.parameters) {
        contract = row.parameters as unknown as ContractParameters
      } else {
        const mockData = (await import('@/lib/db/mock-store')).mockStore.get(id)
        if (mockData?.parameters) contract = mockData.parameters as unknown as ContractParameters
      }
    } catch {
      const mockData = (await import('@/lib/db/mock-store')).mockStore.get(id)
      if (mockData?.parameters) contract = mockData.parameters as unknown as ContractParameters
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


