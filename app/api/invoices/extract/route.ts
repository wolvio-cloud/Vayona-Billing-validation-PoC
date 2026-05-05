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
    const contractId = formData.get('contract_id') as string | null

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

    await mkdir(UPLOAD_DIR, { recursive: true })
    const filePath = join(UPLOAD_DIR, `${Date.now()}_${file.name}`)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    logger.info(`Saved invoice file to ${filePath} (${buffer.length} bytes)`)

    const { text, screenshots } = await parsePDF(buffer)
    logger.info(`Extracted ${text.length} characters and ${screenshots?.length || 0} screenshots from PDF`)

    const MAX_CHARS = 100000;
    const safeText = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;
    if (text.length > MAX_CHARS) {
      logger.warn(`Invoice text truncated at ${MAX_CHARS} characters to enforce cost guardrails.`);
    }

    // Use screenshots if text is very sparse (likely a scanned image)
    const useVisualExtraction = safeText.trim().length < 200 && (screenshots?.length || 0) > 0
    if (useVisualExtraction) {
      logger.info('Sparse text detected. Enabling visual extraction with screenshots.')
    }

    const userMessage = useVisualExtraction
      ? `I am providing both the extracted text (which may be incomplete or empty) and screenshots of the invoice pages. Please extract the data primarily from the visual screenshots if the text is insufficient.\n\nExtracted Text:\n${safeText}`
      : `Extract data from this invoice text:\n\n${safeText}`

    const rawResponse = await callClaude({ 
      systemPrompt: INVOICE_EXTRACTION_SYSTEM_PROMPT, 
      userMessage,
      images: useVisualExtraction ? screenshots : undefined
    })

    logger.info('Raw AI response received', { length: rawResponse.length })

    let parsed: any
    parsed = safeExtractJSON(rawResponse)
    if (!parsed) {
      logger.error('Failed to parse JSON from Claude response', { preview: rawResponse.slice(0, 200) })
      return Response.json({ error: 'Invalid JSON from AI' }, { status: 422 })
    }

    // Heuristic: If the AI nested everything under "header" or "invoice", flatten it
    if (parsed.header && typeof parsed.header === 'object') {
      logger.info('Flattening "header" object from AI response')
      Object.assign(parsed, parsed.header)
    }
    if (parsed.invoice && typeof parsed.invoice === 'object') {
      logger.info('Flattening "invoice" object from AI response')
      Object.assign(parsed, parsed.invoice)
    }

    // Inject contract_id if available and not set by AI
    if (contractId && !parsed.contract_id) {
      parsed.contract_id = contractId
    }

    const validated = InvoiceSchema.safeParse(parsed)
    if (!validated.success) {
      logger.warn('Invoice schema validation failed', { errors: validated.error.issues })
      return Response.json({ 
        error: 'Schema mapping required', 
        partial_data: parsed,
        validation_errors: validated.error.issues 
      }, { status: 206 }) // Partial content
    }

    // Persist to demo data for visibility in the UI lists
    try {
      const demoInvoiceDir = join(process.cwd(), 'demo_data', 'invoices')
      await mkdir(demoInvoiceDir, { recursive: true })
      const demoFilePath = join(demoInvoiceDir, `${validated.data.invoice_id}.json`)
      await writeFile(demoFilePath, JSON.stringify(validated.data, null, 2))
      logger.info(`Persisted extracted invoice to ${demoFilePath}`)
    } catch (err) {
      logger.warn('Failed to persist invoice to demo data', err)
      // Non-fatal, continue returning the data to the client
    }

    return Response.json(validated.data)
  } catch (err: any) {
    logger.error('Invoice extraction failed', err)
    return Response.json({ 
      error: err.message || 'Internal server error',
      detail: err.statusText || 'AI engine failed to respond'
    }, { status: 500 })
  }
}
