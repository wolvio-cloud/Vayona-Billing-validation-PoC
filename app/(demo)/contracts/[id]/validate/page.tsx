import { getDemoContractParameters, getDemoInvoice, getDemoGenerationData } from '@/lib/demo-data'
import { GenerationData } from '@/lib/validation/engine'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ValidationView } from '@/components/validation/ValidationView'

export default async function ValidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ invoice?: string }>
}) {
  const { id } = await params
  const { invoice = 'INV-002' } = await searchParams

  let contract = await getDemoContractParameters(id)
  
  // If not a demo contract, attempt to fetch from DB or mockStore
  if (!contract) {
    const sql = (await import('@/lib/db')).default
    try {
      const [row] = await sql`SELECT parameters FROM contracts WHERE contract_id = ${id} LIMIT 1`
      if (row && row.parameters) {
        contract = row.parameters as any
      } else {
        const mockData = (await import('@/lib/db/mock-store')).mockStore.get(id)
        if (mockData?.parameters) contract = mockData.parameters as any
      }
    } catch (err) {
      console.warn('DB query failed, falling back to mockStore', err)
      const mockData = (await import('@/lib/db/mock-store')).mockStore.get(id)
      if (mockData?.parameters) contract = mockData.parameters as any
    }
  }
  const invData = await getDemoInvoice(invoice)
  if (!contract || !invData) return notFound()

  const genMonthly = await getDemoGenerationData(id)
  let generation: GenerationData | undefined
  if (genMonthly) {
    const relevant = genMonthly.filter((m: any) => m.month >= invData.period_start.substring(0, 7) && m.month <= invData.period_end.substring(0, 7))
    if (relevant.length > 0) {
      generation = {
        total_kwh: relevant.reduce((s: number, m: any) => s + m.kwh, 0),
        availability_pct: relevant.reduce((s: number, m: any) => s + m.availability_pct, 0) / relevant.length,
        period_start: invData.period_start,
        period_end: invData.period_end
      }
    }
  }

  const ALL_INVOICES = ['INV-001', 'INV-002', 'INV-003', 'INV-004', 'INV-005', 'INV-006']

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-6 space-y-10 pb-24">
      {/* Top Bar - Invoice Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {ALL_INVOICES.map(inv => {
          const isActive = invoice === inv
          const dotColor = inv === 'INV-002' ? 'bg-[#EF4444]' : inv === 'INV-004' ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
          return (
            <Link 
              key={inv} 
              href={`/contracts/${id}/validate?invoice=${inv}`} 
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm border ${
                isActive ? 'bg-[--color-wolvio-orange] text-white border-[--color-wolvio-orange]' : 'bg-[--color-wolvio-surface] text-[--color-wolvio-light] border-[--color-wolvio-slate] hover:bg-[--color-wolvio-navy]'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${isActive ? 'ring-2 ring-white/30' : 'ring-1 ring-black/20'}`} />
              {inv}
            </Link>
          )
        })}
      </div>

      <ValidationView 
        contract={contract} 
        initialInvoice={invData} 
        initialGeneration={generation} 
        contractId={id} 
      />

      <div className="pt-20 pb-12 text-center">
        <p className="italic text-[--color-wolvio-mid] text-xl font-medium tracking-wide">
          "Today — how would your team catch this?"
        </p>
      </div>
    </div>
  )
}

