import { createServerSupabaseClient } from '@/lib/supabase/server'
import { runValidation, type GenerationData } from '@/lib/validation/engine'
import { callClaude } from '@/lib/extraction/claude'
import { EXPLANATION_PROMPT_TEMPLATE } from '@/lib/extraction/contract-prompt'
import { ContractParametersSchema } from '@/lib/schemas/contract'
import { InvoiceSchema } from '@/lib/schemas/invoice'
import { ValidationResultSchema } from '@/lib/schemas/validation'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/contracts/validate')

export async function POST(
  request: Request,
  ctx: RouteContext<'/api/contracts/[id]/validate'>
) {
  const { id } = await ctx.params
  const body = await request.json() as { invoice_id: string }
  const supabase = createServerSupabaseClient()

  try {
    // Fetch contract + invoice + generation data
    const [contractRes, invoiceRes] = await Promise.all([
      supabase.from('contracts').select('*').eq('contract_id', id).single(),
      supabase.from('invoices').select('*').eq('invoice_id', body.invoice_id).single(),
    ])

    if (contractRes.error || !contractRes.data) {
      return Response.json({ error: 'Contract not found' }, { status: 404 })
    }
    if (invoiceRes.error || !invoiceRes.data) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const contract = contractRes.data
    if (!contract.parameters) {
      return Response.json({ error: 'Contract not yet extracted' }, { status: 422 })
    }

    const params = ContractParametersSchema.parse(contract.parameters)
    const invoice = InvoiceSchema.parse(invoiceRes.data)

    // Fetch generation data for the invoice period
    const { data: genData } = await supabase
      .from('generation_data')
      .select('*')
      .eq('contract_id', contract.id)
      .gte('period_start', invoice.period_start)
      .lte('period_end', invoice.period_end)

    const generation: GenerationData | undefined = genData?.length
      ? {
          total_kwh: genData.reduce((s: number, r: { total_kwh: number }) => s + r.total_kwh, 0),
          availability_pct: genData[0].availability_pct,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
        }
      : undefined

    // Run checks
    const rawChecks = runValidation(params, invoice, generation)

    // Enrich with Claude explanations
    const checks = await Promise.all(
      rawChecks.map(async (check) => {
        if (check.verdict === 'MATCH' || check.verdict === 'INSUFFICIENT_DATA') {
          return { ...check, explanation: check.verdict === 'MATCH' ? 'All amounts match contract terms.' : 'Insufficient data to validate this check.' }
        }
        try {
          const explanation = await callClaude({
            systemPrompt: 'You are a financial analyst. Be concise and factual.',
            userMessage: EXPLANATION_PROMPT_TEMPLATE({
              check_name: check.check_name,
              expected_amount: check.expected_amount,
              actual_amount: check.actual_amount,
              gap_amount: check.gap_amount ?? check.opportunity_amount,
              source_clause: check.source_clause,
            }),
          })
          return { ...check, explanation }
        } catch {
          return { ...check, explanation: 'Unable to generate explanation.' }
        }
      })
    )

    const totalGap = checks.reduce((s, c) => s + (c.gap_amount ?? 0), 0)
    const totalOpportunity = checks.reduce((s, c) => s + (c.opportunity_amount ?? 0), 0)
    const hasGaps = checks.some((c) => c.verdict === 'GAP')
    const hasOpportunities = checks.some((c) => c.verdict === 'OPPORTUNITY')

    const result = ValidationResultSchema.parse({
      contract_id: id,
      invoice_id: body.invoice_id,
      run_at: new Date().toISOString(),
      checks,
      total_gap_amount: totalGap,
      total_opportunity_amount: totalOpportunity,
      verdict: hasGaps ? 'GAPS_FOUND' : hasOpportunities ? 'REVIEW_REQUIRED' : 'CLEAN',
    })

    // Store validation run
    await supabase.from('validation_runs').insert({
      contract_id: contract.id,
      invoice_id: invoiceRes.data.id,
      checks: result.checks,
      total_gap_amount: result.total_gap_amount,
      total_opportunity_amount: result.total_opportunity_amount,
      verdict: result.verdict,
    })

    logger.info('Validation complete', { contractId: id, invoiceId: body.invoice_id, verdict: result.verdict })
    return Response.json(result)
  } catch (err) {
    logger.error('Validation failed', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
