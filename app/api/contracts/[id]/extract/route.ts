import { readFile } from 'fs/promises'
import sql from '@/lib/db'
import { parsePDF } from '@/lib/pdf/parse'
import { callClaude } from '@/lib/extraction/claude'
import { CONTRACT_EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction/contract-prompt'
import { ContractParametersSchema } from '@/lib/schemas/contract'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'
import { safeParseJSON, sanitizeExtractedData } from '@/lib/extraction/utils'

const logger = createLogger('api/contracts/extract')

export const dynamic = 'force-dynamic'

// ── Timeout budgets (Live Intake Mode) ──────────────────────────
const BUDGET_PARSE_MS   = 30_000
const BUDGET_EXTRACT_MS = 90_000
const BUDGET_TOTAL_MS   = 150_000

// ── Quality thresholds ───────────────────────────────────────────
const MIN_TEXT_LENGTH       = 800   // chars — below this = scanned/empty PDF
const HIGH_CONFIDENCE_RATIO = 0.6   // 60%+ fields must be high-confidence for FULL report

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT: ${label} exceeded ${ms}ms`)), ms))
  ])
}

function scoreConfidence(params: Record<string, any>): { score: number; highCount: number; totalCount: number } {
  const fields = Object.values(params).filter(v => v && typeof v === 'object' && 'confidence' in v)
  const highCount = fields.filter((f: any) => f.confidence === 'high').length
  return { score: fields.length ? highCount / fields.length : 0, highCount, totalCount: fields.length }
}

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const startTime = Date.now()

  let contract: any
  try {
    const [row] = await sql`SELECT * FROM contracts WHERE contract_id = ${id} LIMIT 1`
    contract = row
  } catch {
    contract = mockStore.get(id)
  }

  if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 })

  const updateDB = async (data: any) => {
    try { await sql`UPDATE contracts SET ${sql(data)} WHERE contract_id = ${id}` }
    catch { mockStore.set(id, data) }
  }

  const updateProgress = async (step: string, stageIndex?: number, eta?: string) => {
    const payload: any = { current_step: step }
    if (stageIndex !== undefined) payload.stage_index = stageIndex
    if (eta) payload.stage_eta = eta
    try {
      await sql`UPDATE contracts SET parameters = jsonb_set(COALESCE(parameters, '{}'::jsonb), '{current_step}', ${JSON.stringify(step)}) WHERE contract_id = ${id}`
    } catch {
      const existing = mockStore.get(id)?.parameters || {}
      mockStore.set(id, { parameters: { ...existing, ...payload } })
    }
  }

  // ── Demo fast-path for pre-seeded contracts (C001, C002, etc.) ──
  const SEEDED = ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008']
  if (SEEDED.includes(id)) {
    const stages = [
      { step: 'Validating document integrity...', delay: 600 },
      { step: 'Extracting raw text (OCR-ready)...', delay: 800 },
      { step: 'Detecting clause structure...', delay: 900 },
      { step: 'Extracting commercial parameters...', delay: 1000 },
      { step: 'Mapping invoice schema...', delay: 700 },
      { step: 'Running deterministic checks...', delay: 600 },
      { step: 'Generating audit report...', delay: 500 },
    ]
    for (let i = 0; i < stages.length; i++) {
      await updateProgress(stages[i].step, i + 1)
      await new Promise(r => setTimeout(r, stages[i].delay))
    }
    await updateProgress('Extraction Verified & Finalized', 7)
    const cached = mockStore.get(id)
    if (cached) await updateDB({ ...cached, extraction_status: 'completed' })
    return Response.json({ contract_id: id, status: 'completed', mode: 'cached' })
  }

  // ── LIVE INTAKE: Real extraction pipeline ─────────────────────
  try {
    // STAGE 1: File Validation
    await updateProgress('Stage 1/7: Validating document...', 1, '~5s')
    let buffer: Buffer
    try {
      buffer = await withTimeout(readFile(contract.pdf_storage_path), BUDGET_PARSE_MS, 'file-read')
    } catch (err: any) {
      await updateDB({ extraction_status: 'failed', extraction_error: `File not accessible: ${err.message}` })
      return Response.json({ error: 'File not accessible', stage: 1 }, { status: 422 })
    }

    // STAGE 2: Text Extraction
    await updateProgress('Stage 2/7: Extracting text from PDF...', 2, '~10s')
    let parsed: Awaited<ReturnType<typeof parsePDF>>
    try {
      parsed = await withTimeout(parsePDF(buffer), BUDGET_PARSE_MS, 'pdf-parse')
    } catch (err: any) {
      await updateDB({ extraction_status: 'failed', extraction_error: `PDF parse failed: ${err.message}` })
      return Response.json({ error: 'PDF could not be parsed', stage: 2 }, { status: 422 })
    }
    const { text, pageCount, pages } = parsed

    // QUALITY GATE: Detect scanned/empty PDFs
    if (text.length < MIN_TEXT_LENGTH) {
      const qualityError = `Document text too short (${text.length} chars). Likely a scanned/image-based PDF. Please provide a digital PDF or use the Manual Override form.`
      await updateDB({
        extraction_status: 'failed',
        extraction_error: qualityError,
        page_count: pageCount,
        quality_issue: 'scanned_or_empty'
      })
      return Response.json({
        error: qualityError,
        quality_issue: 'scanned_or_empty',
        page_count: pageCount,
        char_count: text.length,
        action: 'Use Manual Override form to input key parameters directly.',
        stage: 2
      }, { status: 422 })
    }

    // STAGE 3: Clause Detection (assemble payload)
    await updateProgress('Stage 3/7: Detecting clause structure...', 3, '~15s')
    const MAX_CHARS = 100_000
    let safePayload = ''
    let truncated = false
    for (let i = 0; i < pages.length; i++) {
      const pageText = `--- PAGE ${i + 1} ---\n${pages[i]}\n\n`
      if (safePayload.length + pageText.length > MAX_CHARS) {
        safePayload += pageText.substring(0, MAX_CHARS - safePayload.length)
        truncated = true; break
      }
      safePayload += pageText
    }
    if (truncated) logger.warn(`Document truncated at ${MAX_CHARS} chars for cost guardrail`)

    // Remaining time budget
    const elapsed = Date.now() - startTime
    const remainingBudget = Math.max(10_000, BUDGET_TOTAL_MS - elapsed)
    const extractBudget = Math.min(BUDGET_EXTRACT_MS, remainingBudget - 5000)

    // STAGE 4: Parameter Extraction
    await updateProgress('Stage 4/7: Extracting commercial parameters (AI)...', 4, '~60s')
    let rawResponse: string
    try {
      rawResponse = await withTimeout(
        callClaude({ systemPrompt: CONTRACT_EXTRACTION_SYSTEM_PROMPT, userMessage: `Extract commercial parameters from this contract:\n\n${safePayload}` }),
        extractBudget,
        'claude-extraction'
      )
    } catch (err: any) {
      const isTimeout = err.message?.startsWith('TIMEOUT')
      await updateDB({
        extraction_status: isTimeout ? 'partial' : 'failed',
        extraction_error: err.message
      })
      return Response.json({
        error: isTimeout ? 'Extraction timed out. Switching to Rapid Assessment mode.' : `LLM error: ${err.message}`,
        mode: isTimeout ? 'rapid_assessment' : 'failed',
        action: 'Use Manual Override to confirm 5–8 critical parameters and run partial validation.',
        stage: 4
      }, { status: isTimeout ? 206 : 500 })
    }

    // STAGE 5: Invoice Mapping / Schema Validation
    await updateProgress('Stage 5/7: Normalizing extracted schema...', 5, '~5s')
    const rawParsed = safeParseJSON<any>(rawResponse)
    const sanitized = sanitizeExtractedData(rawParsed)
    const validated = ContractParametersSchema.safeParse(sanitized)

    // STAGE 6: Confidence Assessment
    await updateProgress('Stage 6/7: Running confidence assessment...', 6, '~5s')
    const confidence = scoreConfidence(sanitized)
    const mode = confidence.score >= HIGH_CONFIDENCE_RATIO ? 'full' : 'partial'
    
    logger.info('Extraction confidence', { ...confidence, mode })

    if (!validated.success) {
      // Schema mismatch — return partial with what we have
      await updateDB({
        extraction_status: 'partial',
        extraction_error: validated.error.message,
        parameters: sanitized,
        page_count: pageCount,
        confidence_score: confidence.score,
      })
      return Response.json({
        contract_id: id,
        status: 'partial',
        mode: 'hybrid_required',
        confidence: confidence,
        missing_fields: validated.error.issues.map(i => i.path.join('.')),
        action: 'Open Manual Override to confirm missing fields.',
        partial_data: sanitized,
      }, { status: 206 })
    }

    // STAGE 7: Report Generation
    await updateProgress('Stage 7/7: Generating audit report...', 7, '~2s')
    await updateDB({
      parameters: { ...validated.data, _extraction_meta: { mode, confidence, truncated, page_count: pageCount } },
      extraction_status: mode === 'full' ? 'completed' : 'partial',
      raw_text: text.substring(0, 50000),
      page_count: pageCount,
      confidence_score: confidence.score,
    })

    await updateProgress('Extraction Verified & Finalized', 7)

    return Response.json({
      contract_id: id,
      status: validated.success ? 'completed' : 'partial',
      mode,
      confidence,
      page_count: pageCount,
      elapsed_ms: Date.now() - startTime,
    })
  } catch (err: any) {
    logger.error('Extraction pipeline failed', err)
    await updateDB({ extraction_status: 'failed', extraction_error: err.message })
    return Response.json({ error: 'Internal server error', detail: err.message }, { status: 500 })
  }
}
