import { createServerSupabaseClient } from '@/lib/supabase/server'
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
  const supabase = createServerSupabaseClient()

  try {
    // 1. Fetch contract record
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('contract_id', id)
      .single()

    if (fetchError || !contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 })
    }

    // 2. Fetch PDF from storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('contract-pdfs')
      .download(contract.pdf_storage_path)

    if (storageError || !fileData) {
      return Response.json({ error: 'PDF not found in storage' }, { status: 404 })
    }

    // 3. Parse PDF
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const { text, pageCount, chunks } = await parsePDF(buffer)

    // Store raw text
    await supabase
      .from('contracts')
      .update({ raw_text: text, page_count: pageCount, extraction_status: 'processing' })
      .eq('contract_id', id)

    // 4. Call Claude for extraction
    const userMessage = chunks.length === 1
      ? `Extract commercial parameters from this contract:\n\n${chunks[0]}`
      : `Extract commercial parameters from this contract (page ${1} of ${chunks.length}):\n\n${chunks[0]}`

    const rawResponse = await callClaude({
      systemPrompt: CONTRACT_EXTRACTION_SYSTEM_PROMPT,
      userMessage,
    })

    // 5. Validate with Zod
    let parsed: unknown
    try {
      parsed = JSON.parse(rawResponse)
    } catch {
      logger.error('Claude returned invalid JSON', { rawResponse: rawResponse.slice(0, 500) })
      await supabase
        .from('contracts')
        .update({ extraction_status: 'failed', extraction_error: 'Invalid JSON from Claude' })
        .eq('contract_id', id)
      return Response.json({ error: 'Extraction failed: invalid JSON' }, { status: 422 })
    }

    const validated = ContractParametersSchema.safeParse(parsed)
    if (!validated.success) {
      const errorMsg = validated.error.message
      logger.error('Schema validation failed', { errorMsg })
      await supabase
        .from('contracts')
        .update({ extraction_status: 'failed', extraction_error: errorMsg })
        .eq('contract_id', id)
      return Response.json({ error: 'Extraction failed: schema mismatch', details: errorMsg }, { status: 422 })
    }

    // 6. Store parameters
    await supabase
      .from('contracts')
      .update({ parameters: validated.data, extraction_status: 'completed' })
      .eq('contract_id', id)

    const parameterCount = Object.keys(validated.data).length
    logger.info('Extraction complete', { contractId: id, parameterCount })

    return Response.json({ contract_id: id, status: 'completed', parameter_count: parameterCount })
  } catch (err) {
    logger.error('Extraction failed', err)
    await supabase
      .from('contracts')
      .update({ extraction_status: 'failed', extraction_error: String(err) })
      .eq('contract_id', id)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
