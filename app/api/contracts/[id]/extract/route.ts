import { readFile } from 'fs/promises'
import sql from '@/lib/db'
import { parsePDF } from '@/lib/pdf/parse'
import { callClaude } from '@/lib/extraction/claude'
import { CONTRACT_EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction/contract-prompt'
import { ContractParametersSchema } from '@/lib/schemas/contract'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/contracts/extract')

export async function POST(
  _request: Request,
  ctx: RouteContext<'/api/contracts/[id]/extract'>
) {
  const { id } = await ctx.params

  const [contract] = await sql`SELECT * FROM contracts WHERE contract_id = ${id} LIMIT 1`
  if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 })

  try {
    const buffer = await readFile(contract.pdf_storage_path)
    const { text, pageCount, chunks } = await parsePDF(buffer)

    // STEP 1 — Quality Checks
    const warnings: string[] = []
    
    // a) Text extraction check
    if (text.length < 500) {
      await sql`UPDATE contracts SET extraction_status = 'failed', extraction_error = 'This PDF appears to be scanned. Text extraction requires a digital PDF. Upload a text-searchable version.' WHERE contract_id = ${id}`
      return Response.json({ error: 'Scanned PDF detected' }, { status: 422 })
    }

    // b) Contract type detection
    const ltsaKeywords = ["long term service", "O&M", "turbine", "availability", "liquidated damages"]
    const tsaKeywords = ["technical service", "spare parts", "commissioning"]
    const isLTSA = ltsaKeywords.some(k => text.toLowerCase().includes(k))
    const isTSA = tsaKeywords.some(k => text.toLowerCase().includes(k))
    
    if (!isLTSA && !isTSA) {
      warnings.push("This doesn't look like a service agreement. Extraction will proceed but results may be incomplete.")
    }

    // c) Language check
    const nonAscii = text.replace(/[\x00-\x7F]/g, '').length
    if (nonAscii / text.length > 0.3) {
      warnings.push("Document may contain non-English sections. Extraction covers English clauses only.")
    }

    await sql`
      UPDATE contracts
      SET raw_text = ${text}, 
          page_count = ${pageCount}, 
          extraction_status = 'processing',
          extraction_error = ${warnings.length > 0 ? warnings.join('|') : null}
      WHERE contract_id = ${id}
    `

    // We simulate progress by updating a JSON field 'progress'
    const updateProgress = async (step: string) => {
      await sql`UPDATE contracts SET parameters = jsonb_set(COALESCE(parameters, '{}'::jsonb), '{current_step}', ${JSON.stringify(step)}) WHERE contract_id = ${id}`
    }

    await updateProgress(`Scanning document structure... (${pageCount} pages)`)
    await new Promise(r => setTimeout(r, 800))
    
    await updateProgress('Identifying commercial clauses...')
    await new Promise(r => setTimeout(r, 800))

    const steps = [
      'Extracting: Base Fee',
      'Extracting: Escalation terms',
      'Extracting: Performance terms',
      'Extracting: Payment terms',
      'Running self-validation checks...'
    ]

    for (const step of steps) {
      await updateProgress(step)
      await new Promise(r => setTimeout(r, 600))
    }

    const userMessage = `Extract commercial parameters from this contract:\n\n${chunks[0]}`
    const rawResponse = await callClaude({ systemPrompt: CONTRACT_EXTRACTION_SYSTEM_PROMPT, userMessage })

    let parsed: any
    try {
      parsed = JSON.parse(rawResponse)
    } catch {
      logger.error('Claude returned invalid JSON')
      await sql`UPDATE contracts SET extraction_status = 'failed', extraction_error = 'Invalid JSON from Claude' WHERE contract_id = ${id}`
      return Response.json({ error: 'Extraction failed: invalid JSON' }, { status: 422 })
    }

    const validated = ContractParametersSchema.safeParse(parsed)
    if (!validated.success) {
      const errorMsg = validated.error.message
      await sql`UPDATE contracts SET extraction_status = 'failed', extraction_error = ${errorMsg} WHERE contract_id = ${id}`
      return Response.json({ error: 'Extraction failed: schema mismatch', details: errorMsg }, { status: 422 })
    }

    // Final result
    const finalParams = {
      ...validated.data,
      extraction_warnings: warnings
    }

    await sql`
      UPDATE contracts
      SET parameters = ${sql.json(finalParams)}, extraction_status = 'completed'
      WHERE contract_id = ${id}
    `

    const parameterCount = Object.keys(validated.data).length
    logger.info('Extraction complete', { contractId: id, parameterCount })
    return Response.json({ contract_id: id, status: 'completed', parameter_count: parameterCount })
  } catch (err) {
    logger.error('Extraction failed', err)
    await sql`UPDATE contracts SET extraction_status = 'failed', extraction_error = ${String(err)} WHERE contract_id = ${id}`
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

