// We use dynamic import for pdf-parse because it has side effects (DOMMatrix polyfills)
// that crash the Next.js build during static analysis.
let pdfParse: any = null
import { createLogger } from '@/lib/logger'

const logger = createLogger('pdf-parse')
const CHUNK_SIZE = 100_000

export interface ParsedPDF {
  text: string
  pageCount: number
  chunks: string[]
  pages: string[] // NEW: Array of text per page
}

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  if (!pdfParse) {
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    pdfParse = require('pdf-parse')
  }

  return logger.timed('parsePDF', async () => {
    // pdf-parse uses \f for page breaks by default
    const result = await pdfParse(buffer)
    const rawText = result.text
    const pageCount = result.numpages

    // Split by form feed and clean up
    const pages = rawText.split('\f').map((p: string) => p.replace(/\s+/g, ' ').trim()).filter((p: string) => p.length > 0)
    const text = pages.join(' ')

    // For extraction, we group pages into chunks of ~50KB to stay within context limits
    // but without cutting sentences in half randomly
    const chunks: string[] = []
    let currentChunk = ''
    
    for (const pageText of pages) {
      if ((currentChunk.length + pageText.length) > CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = ''
      }
      currentChunk += pageText + '\n\n'
    }
    if (currentChunk.length > 0) chunks.push(currentChunk)

    logger.info(`Parsed PDF (Page-Aware)`, { pageCount, chars: text.length, chunks: chunks.length })
    return { text, pageCount, chunks, pages }
  })
}

