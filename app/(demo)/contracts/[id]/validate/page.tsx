import { getDemoContractParameters, getDemoInvoice, getDemoGenerationData, getDemoInvoiceList } from '@/lib/demo-data'
import { GenerationData } from '@/lib/validation/engine'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ValidationView } from '@/components/validation/ValidationView'

// Color hints for invoice tabs — tells the operator at a glance what scenario each invoice is
const INV_DOT: Record<string, string> = {
  'INV-001': 'bg-[#22C55E]',  // green = clean
  'INV-002': 'bg-[#EF4444]',  // red   = gap (main demo scenario)
  'INV-003': 'bg-[#EF4444]',  // red   = gap / opportunity
  'INV-004': 'bg-[#F59E0B]',  // amber = disputed / LD
  'INV-005': 'bg-[#22C55E]',  // green = clean / bonus opportunity
  'INV-006': 'bg-[#22C55E]',  // green = clean
}

export default async function ValidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ invoice?: string }>
}) {
  const { id } = await params
  console.log(`[ValidatePage] Loading id=${id}`)
  
  // Only show the demo selector for seeded IDs (C001-C008)
  const isDemoContract = id.startsWith('C00') && id.length <= 4
  const allInvoices = isDemoContract ? await getDemoInvoiceList(id) : []
  const defaultInvoice = allInvoices.length > 0 ? allInvoices[0] : null
  const { invoice = defaultInvoice } = await searchParams

  let contract: any = null
  let displayName: string = ''
  
  const sql = (await import('@/lib/db')).default
  try {
    const [row] = await sql`SELECT parameters, display_name FROM contracts WHERE contract_id = ${id} LIMIT 1`
    if (row) {
      contract = row.parameters
      displayName = row.display_name
    }
  } catch (err) {
    console.error('DB fetch failed on validate page', err)
  }

  // Fallback to demo data
  if (!contract) {
    contract = await getDemoContractParameters(id)
    displayName = id === 'C001' ? 'Wind Farm Alpha LTSA' : id
    console.log(`[ValidatePage] Demo fallback for ${id}: ${contract ? 'FOUND' : 'NOT FOUND'}`)
  }

  // Load invoice if provided
  const invData = invoice ? await getDemoInvoice(invoice, id) : null
  
  if (!contract) {
    console.error(`[ValidatePage] Contract ${id} not found, triggering 404`)
    return notFound()
  }

  const genMonthly = await getDemoGenerationData(id)
  let generation: GenerationData | undefined
  if (genMonthly && invData) {
    const relevant = genMonthly.filter((m: any) =>
      m.month >= invData.period_start.substring(0, 7) &&
      m.month <= invData.period_end.substring(0, 7)
    )
    if (relevant.length > 0) {
      generation = {
        total_kwh: relevant.reduce((s: number, m: any) => s + m.kwh, 0),
        availability_pct: relevant.reduce((s: number, m: any) => s + m.availability_pct, 0) / relevant.length,
        period_start: invData.period_start,
        period_end: invData.period_end
      }
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-6 space-y-10 pb-24">
      <ValidationView
        contract={contract}
        initialInvoice={invData}
        initialGeneration={generation}
        contractId={id}
        contractDisplayName={displayName}
        allInvoices={allInvoices}
      />

      <div className="pt-20 pb-12 text-center">
        <p className="italic text-slate-500 text-xl font-medium tracking-wide">
          &quot;Today — how would your team catch this?&quot;
        </p>
      </div>
    </div>
  )
}
