import { createRequire } from 'module'
const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>
import { createLogger } from '@/lib/logger'

const logger = createLogger('pdf-parse')
const CHUNK_SIZE = 100_000

export interface ParsedPDF {
  text: string
  pageCount: number
  chunks: string[]
}

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  return logger.timed('parsePDF', async () => {
    const result = await pdfParse(buffer)
    const text = result.text.replace(/\s+/g, ' ').trim()
    const pageCount = result.numpages

    const chunks: string[] = []
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE))
    }

    logger.info(`Parsed PDF`, { pageCount, chars: text.length, chunks: chunks.length })
    return { text, pageCount, chunks }
  })
}
