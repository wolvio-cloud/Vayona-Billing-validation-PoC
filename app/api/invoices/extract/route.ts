import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { parsePDF } from '@/lib/pdf/parse'
import { callClaude } from '@/lib/extraction/claude'
import { INVOICE_EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction/invoice-prompt'
import { InvoiceSchema } from '@/lib/schemas/invoice'
import { createLogger } from '@/lib/logger'

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

    const userMessage = `Extract data from this invoice text:\n\n${text}`
    const rawResponse = await callClaude({ 
      systemPrompt: INVOICE_EXTRACTION_SYSTEM_PROMPT, 
      userMessage 
    })

    let parsed: any
    try {
      parsed = JSON.parse(rawResponse)
    } catch {
      return Response.json({ error: 'Invalid JSON from AI' }, { status: 422 })
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
