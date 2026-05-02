import sql from '@/lib/db'
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

  try {
    const [[contract], [invoice]] = await Promise.all([
      sql`SELECT * FROM contracts WHERE contract_id = ${id} LIMIT 1`,
      sql`SELECT * FROM invoices WHERE invoice_id = ${body.invoice_id} LIMIT 1`,
    ])

    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 })
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 })
    if (!contract.parameters) return Response.json({ error: 'Contract not yet extracted' }, { status: 422 })

    const params = ContractParametersSchema.parse(contract.parameters)
    const inv = InvoiceSchema.parse({ ...invoice, line_items: invoice.line_items ?? [] })

    const [genRow] = await sql`
      SELECT
        SUM(total_kwh) as total_kwh,
        AVG(availability_pct) as availability_pct
      FROM generation_data
      WHERE contract_id = ${contract.id}
        AND period_start >= ${inv.period_start}
        AND period_end <= ${inv.period_end}
    `

    const generation: GenerationData | undefined = genRow?.total_kwh
      ? {
          total_kwh: Number(genRow.total_kwh),
          availability_pct: Number(genRow.availability_pct),
          period_start: inv.period_start,
          period_end: inv.period_end,
        }
      : undefined

    const rawChecks = runValidation(params, inv, generation)

    const checks = await Promise.all(
      rawChecks.map(async (check) => {
        if (check.verdict === 'MATCH') return { ...check, explanation: 'All amounts match contract terms.' }
        if (check.verdict === 'INSUFFICIENT_DATA') return { ...check, explanation: 'Insufficient data to validate.' }
        try {
          const systemPrompt = check.verdict === 'OPPORTUNITY'
            ? 'You are a revenue recovery analyst. You found money that was earned but not claimed. Be enthusiastic but precise. Tell the FC exactly what she can bill and why. You write 2 sentences maximum. No greeting. No sign-off.'
            : 'You are a CFO briefing your Finance Controller via WhatsApp. You are direct, specific, and action-oriented. You use rupee amounts, not percentages. You name the clause. You tell her exactly what to do. You never say \'it appears\' or \'it seems\' or \'please note\'. You write 2 sentences maximum. No greeting. No sign-off.'

          const explanation = await callClaude({
            systemPrompt,
            userMessage: EXPLANATION_PROMPT_TEMPLATE({
              clause_reference: check.clause_reference,
              source_clause: check.source_clause,
              expected: check.expected_amount,
              actual: check.actual_amount,
              gap: check.gap_amount ?? check.opportunity_amount,
              period: inv.period_start + ' to ' + inv.period_end,
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

    await sql`
      INSERT INTO validation_runs (contract_id, invoice_id, checks, total_gap_amount, total_opportunity_amount, verdict)
      VALUES (${contract.id}, ${invoice.id}, ${sql.json(result.checks)}, ${totalGap}, ${totalOpportunity}, ${result.verdict})
    `

    logger.info('Validation complete', { contractId: id, invoiceId: body.invoice_id, verdict: result.verdict })
    return Response.json(result)
  } catch (err) {
    logger.error('Validation failed', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
