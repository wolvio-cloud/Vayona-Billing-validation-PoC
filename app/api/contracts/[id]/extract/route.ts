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

    await sql`
      UPDATE contracts
      SET raw_text = ${text}, page_count = ${pageCount}, extraction_status = 'processing'
      WHERE contract_id = ${id}
    `

    const userMessage = `Extract commercial parameters from this contract:\n\n${chunks[0]}`
    const rawResponse = await callClaude({ systemPrompt: CONTRACT_EXTRACTION_SYSTEM_PROMPT, userMessage })

    let parsed: unknown
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

    await sql`
      UPDATE contracts
      SET parameters = ${sql.json(validated.data)}, extraction_status = 'completed'
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
