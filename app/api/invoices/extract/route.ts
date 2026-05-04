import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { parsePDF } from '@/lib/pdf/parse'
import { callClaude } from '@/lib/extraction/claude'
import { INVOICE_EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction/invoice-prompt'
import { InvoiceSchema } from '@/lib/schemas/invoice'
import { createLogger } from '@/lib/logger'
import { safeExtractJSON } from '@/lib/utils'

const logger = createLogger('api/invoices/extract')
const UPLOAD_DIR = './uploads/invoices'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

    await mkdir(UPLOAD_DIR, { recursive: true })
    const filePath = join(UPLOAD_DIR, `${Date.now()}_${file.name}`)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const { text } = await parsePDF(Buffer.from(bytes))

    const MAX_CHARS = 100000;
    const safeText = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;
    if (text.length > MAX_CHARS) {
      logger.warn(`Invoice text truncated at ${MAX_CHARS} characters to enforce cost guardrails.`);
    }

    const userMessage = `Extract data from this invoice text:\n\n${safeText}`
    const rawResponse = await callClaude({ 
      systemPrompt: INVOICE_EXTRACTION_SYSTEM_PROMPT, 
      userMessage 
    })

    let parsed: unknown
    parsed = safeExtractJSON(rawResponse)
    if (!parsed) {
      logger.error('Failed to parse JSON from Claude response', { preview: rawResponse.slice(0, 200) })
      return Response.json({ error: 'Invalid JSON from AI — Claude may have wrapped response in markdown. Check logs.' }, { status: 422 })
    }

    const validated = InvoiceSchema.safeParse(parsed)
    if (!validated.success) {
      return Response.json({ error: 'Schema mismatch', details: validated.error.message }, { status: 422 })
    }

    return Response.json(validated.data)
  } catch (err) {
    logger.error('Invoice extraction failed', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
