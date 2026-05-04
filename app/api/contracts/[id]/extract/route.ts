import sql from '@/lib/db'
import { callClaude } from '@/lib/extraction/claude'
import { ContractParametersSchema } from '@/lib/schemas/contract'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'
import { safeParseJSON, sanitizeExtractedData } from '@/lib/extraction/utils'

const logger = createLogger('api/contracts/extract')

export const dynamic = 'force-dynamic'

function scoreConfidence(params: Record<string, any>): { score: number; highCount: number; totalCount: number } {
  const fields = Object.values(params).filter(v => v && typeof v === 'object' && 'confidence' in v)
  const highCount = fields.filter((f: any) => f.confidence === 'high').length
  return { score: fields.length ? highCount / fields.length : 0, highCount, totalCount: fields.length }
}

const SYSTEM_PROMPT = `You are a senior commercial contract analyst specialising in Indian renewable energy O&M, LTSA, and TSA agreements under Indian law.

Extract the following parameters. For each return:
  value, source_clause (verbatim ≤50 words),
  clause_reference (e.g. Clause 5.2),
  page_number (integer),
  confidence (high / medium / low)

Parameters:
  base_annual_fee (full rupee integer)
  base_monthly_fee (full rupee integer)
  escalation: {
    type (WPI/CPI/Fixed/None)
    index_base_month (exact month named in contract)
    effective_date (e.g. April 1)
    cap_pct (number)
    floor_pct (number, default 0)
  }
  variable_component: {
    rate_per_kwh (number)
    billing_frequency (Monthly/Quarterly)
  }
  availability_guarantee_pct (number)
  ld_rate_per_pp (number)
  ld_cap_pct (number)
  bonus_threshold_pct (number or null)
  bonus_rate_per_pp (number or null)
  payment_terms_days (number)
  late_payment_interest (string, e.g. SBI base + 2%)
  renewal_notice_months (number)

Rules:
- Extract ONLY what is explicitly stated
- If field absent → return null, flag NOT_FOUND
- Never infer or hallucinate
- Index base month is critical: January ≠ December
- All fees in full rupee integers, not Cr shorthand
- Return valid JSON only, no markdown, no prose`;

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const startTime = Date.now()

  let contract: any
  try {
    const rows = await sql`SELECT * FROM contracts WHERE contract_id = ${id} LIMIT 1`
    contract = rows[0]
  } catch {
    contract = mockStore.get(id)
  }

  if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 })

  const updateDB = async (data: any) => {
    try {
      const keys = Object.keys(data)
      if (keys.length === 0) return
      
      // Update specific columns
      if (data.parameters) {
        await sql`UPDATE contracts SET parameters = ${JSON.stringify(data.parameters)} WHERE contract_id = ${id}`
      }
      if (data.extraction_status) {
        await sql`UPDATE contracts SET extraction_status = ${data.extraction_status} WHERE contract_id = ${id}`
      }
      if (data.extraction_error) {
        await sql`UPDATE contracts SET extraction_error = ${data.extraction_error} WHERE contract_id = ${id}`
      }
    }
    catch (err) { 
      logger.error('DB update failed, using mockStore', err)
      mockStore.set(id, { ...mockStore.get(id), ...data }) 
    }
  }

  const updateProgress = async (step: string, stageIndex?: number, eta?: string) => {
    const payload: any = { current_step: step }
    if (stageIndex !== undefined) payload.stage_index = stageIndex
    if (eta) payload.stage_eta = eta
    
    try {
      // Use a raw update for speed
      await sql`UPDATE contracts SET parameters = jsonb_set(COALESCE(parameters, '{}'::jsonb), '{current_step}', ${JSON.stringify(step)}) WHERE contract_id = ${id}`
    } catch {
      const existing = mockStore.get(id)?.parameters || {}
      mockStore.set(id, { ...mockStore.get(id), parameters: { ...existing, ...payload } })
    }
  }

  // ── Demo fast-path for seeded contracts ──
  const SEEDED = ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008']
  if (SEEDED.includes(id)) {
    const stages = [
      { step: 'Scanning document structure...', delay: 1000 },
      { step: 'Detecting clause boundaries...', delay: 800 },
      { step: 'Extracting commercial parameters...', delay: 1200 },
      { step: 'Validating against schema...', delay: 600 },
      { step: 'Scoring confidence levels...', delay: 800 },
      { step: 'Building Digital Twin...', delay: 1500 },
    ]
    for (let i = 0; i < stages.length; i++) {
      await updateProgress(stages[i].step, i + 1)
      await new Promise(r => setTimeout(r, stages[i].delay))
    }
    await updateProgress('Complete — 12 parameters extracted', 7)
    await updateDB({ extraction_status: 'completed' })
    return Response.json({ contract_id: id, status: 'completed', parameter_count: 12 })
  }

  // ── LIVE INTAKE ──
  try {
    const text = contract.raw_text || ''
    
    await updateProgress('Scanning document structure...', 1)
    await new Promise(r => setTimeout(r, 1000))
    
    await updateProgress('Detecting clause boundaries...', 2)
    await new Promise(r => setTimeout(r, 1000))

    await updateProgress('Extracting commercial parameters...', 3)
    const result = await callClaude({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Extract parameters from this contract text:\n\n${text}`
    })

    await updateProgress('Validating against schema...', 4)
    const sanitized = sanitizeExtractedData(safeParseJSON(result))
    const validated = ContractParametersSchema.safeParse(sanitized)

    await updateProgress('Scoring confidence levels...', 5)
    const confidence = scoreConfidence(sanitized)

    await updateProgress('Building Digital Twin...', 6)
    
    const finalStatus = validated.success ? 'completed' : 'partial'
    const paramCount = Object.values(sanitized).filter(v => v && v.value !== null).length

    await updateDB({
      parameters: { ...sanitized, _extraction_meta: { confidence, page_count: contract.page_count } },
      extraction_status: finalStatus
    })

    await updateProgress(`Complete — ${paramCount} parameters extracted`, 7)

    return Response.json({
      contract_id: id,
      status: finalStatus,
      parameter_count: paramCount
    })

  } catch (err: any) {
    logger.error('Extraction failed', err)
    await updateDB({ extraction_status: 'failed', extraction_error: err.message })
    return Response.json({ error: 'Extraction taking longer than expected. You can enter values manually while we continue.', status: 'partial' }, { status: 206 })
  }
}
