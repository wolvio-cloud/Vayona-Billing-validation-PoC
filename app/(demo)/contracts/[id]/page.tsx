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
  let displayName = 'Service Agreement'
  
  let extractionStatus = 'pending'
  
  // Try demo JSON files first (C001–C008 all have JSON files)
  if (id.startsWith('C')) {
    contract = await getDemoContractParameters(id)
    if (contract) {
      extractionStatus = 'completed'
      if (id === 'C100') displayName = 'Adani Green — Mega Wind Portfolio'
      else if (id === 'C001') displayName = 'Wind Farm Alpha — LTSA'
      else if (id === 'C002') displayName = 'ReNew Power Mega-LTSA'
    }
  }

  // If not found in demo data, check database / mockStore (for uploaded contracts)
  if (!contract) {
    try {
      const rows = await sql`SELECT parameters, display_name, extraction_status FROM contracts WHERE contract_id::text = ${id} OR id::text = ${id} LIMIT 1`
      const row = rows[0]
      if (row) {
        extractionStatus = row.extraction_status || 'completed'
      }
      if (row?.parameters) {
        contract = row.parameters as unknown as ContractParameters
        displayName = row.display_name || displayName
      } else {
        const mockData = (await import('@/lib/db/mock-store')).mockStore.get(id)
        if (mockData?.parameters) {
          contract = mockData.parameters as unknown as ContractParameters
          displayName = mockData.display_name || displayName
          extractionStatus = mockData.extraction_status || extractionStatus
        }
      }
    } catch {
      const mockData = (await import('@/lib/db/mock-store')).mockStore.get(id)
      if (mockData?.parameters) {
        contract = mockData.parameters as unknown as ContractParameters
        displayName = mockData.display_name || displayName
        extractionStatus = mockData.extraction_status || extractionStatus
      }
    }
  }

  // Double check mock store if extraction status is still considered pending or missing
  if (extractionStatus === 'completed') {
    try {
      const mockData = (await import('@/lib/db/mock-store')).mockStore.get(id)
      if (mockData && mockData.extraction_status) {
        extractionStatus = mockData.extraction_status
      }
    } catch (err) {}
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
        displayName={displayName}
        extractionStatus={extractionStatus}
      />
    </div>
  )
}


