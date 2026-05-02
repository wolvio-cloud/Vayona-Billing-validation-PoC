import { getDemoContractParameters, getDemoInvoice, getDemoGenerationData } from '@/lib/demo-data'
import { runValidation, type GenerationData } from '@/lib/validation/engine'
import { ValidationReport } from '@/components/validation/ValidationReport'
import { ValidationResultSchema } from '@/lib/schemas/validation'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ValidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ invoice?: string }>
}) {
  const { id } = await params
  const { invoice = 'INV-002' } = await searchParams

  const contract = await getDemoContractParameters(id)
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

  const rawChecks = runValidation(contract, invData, generation)
  const checks = rawChecks.map((check) => ({
    ...check,
    explanation: check.verdict === 'MATCH' ? 'All amounts match contract terms.' : 
      check.verdict === 'GAP' ? `Clause ${check.clause_reference} requires WPI escalation from April 1 using the January index — the invoice uses the pre-escalation rate instead of the correct escalated amount. Raise a corrective invoice for ₹${check.gap_amount?.toLocaleString('en-IN')} and apply the escalated rate to all future months this financial year.` :
      `Availability hit 98.4% in July — above the bonus threshold in ${check.clause_reference}. Raise a bonus invoice for ₹${check.opportunity_amount?.toLocaleString('en-IN')} before the 30-day billing window closes.`
  }))

  const totalGap = checks.reduce((s, c) => s + (c.gap_amount ?? 0), 0)
  const totalOpportunity = checks.reduce((s, c) => s + (c.opportunity_amount ?? 0), 0)
  const hasGaps = checks.some((c) => c.verdict === 'GAP')
  const hasOpportunities = checks.some((c) => c.verdict === 'OPPORTUNITY')

  const result = ValidationResultSchema.parse({
    contract_id: id,
    invoice_id: invoice,
    run_at: new Date().toISOString(),
    checks,
    total_gap_amount: totalGap,
    total_opportunity_amount: totalOpportunity,
    verdict: hasGaps ? 'GAPS_FOUND' : hasOpportunities ? 'REVIEW_REQUIRED' : 'CLEAN',
  })

  const ALL_INVOICES = ['INV-001', 'INV-002', 'INV-003', 'INV-004', 'INV-005', 'INV-006']

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-6 space-y-10 pb-24">
      {/* Top Bar - Invoice Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {ALL_INVOICES.map(inv => {
          const isActive = invoice === inv
          const dotColor = inv === 'INV-002' ? 'bg-[#DC2626]' : inv === 'INV-004' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
          return (
            <Link 
              key={inv} 
              href={`/contracts/${id}/validate?invoice=${inv}`} 
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                isActive ? 'bg-[--color-wolvio-orange] text-white' : 'bg-white text-[--color-wolvio-navy] border border-[--color-wolvio-light] hover:bg-orange-50 hover:border-orange-200'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${isActive ? 'ring-2 ring-white/50' : ''}`} />
              {inv}
            </Link>
          )
        })}
      </div>

      <ValidationReport result={result} />

      <div className="pt-20 pb-12 text-center">
        <p className="italic text-[--color-wolvio-navy] text-xl font-medium tracking-wide">
          "Today — how would your team catch this?"
        </p>
      </div>
    </div>
  )
}
