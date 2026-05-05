import { createLogger } from '@/lib/logger'

const logger = createLogger('pdf-parse')
const CHUNK_SIZE = 100_000

export interface ParsedPDF {
  text: string
  pageCount: number
  chunks: string[]
  pages: string[]
  screenshots?: string[] // base64 images
}

// Lazy-loaded pdf-parse
let pdfParse: any = null

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  if (!pdfParse) {
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    const mod = require('pdf-parse')
    logger.info('Lazy-loaded pdf-parse module keys:', Object.keys(mod))
    pdfParse = mod.PDFParse || mod.default?.PDFParse || mod.default
    if (!pdfParse) {
      logger.error('Failed to find PDFParse in module', { keys: Object.keys(mod) })
      throw new Error('pdf-parse module initialization failed')
    }
  }

  return logger.timed('parsePDF', async () => {
    const parser = new pdfParse({ data: buffer, verbosity: 0 })
    
    // 1. Get Text
    const textResult = await parser.getText()
    const rawText: string = textResult.text
    const pageCount: number = textResult.total

    let pages: string[] = []
    if (textResult.pages && Array.isArray(textResult.pages)) {
      pages = textResult.pages.map((p: any) => 
        p.text.split('\n')
          .map((line: string) => line.replace(/[ \t]+/g, ' ').trim())
          .filter((line: string) => line.length > 0)
          .join('\n')
      ).filter((p: string) => p.length > 0)
    }

    // Fallback if structured pages is empty but rawText has content
    if (pages.length === 0 && rawText.trim().length > 0) {
      pages = [rawText]
    }

    const text = pages.join('\n\n--- PAGE BREAK ---\n\n')

    // 2. Get Screenshots for the first 3 pages (as fallback for OCR)
    const screenshots: string[] = []
    try {
      const screenshotResult = await parser.getScreenshot({ 
        first: 1, 
        last: Math.min(pageCount, 3), 
        scale: 1.5 // Good balance of quality vs token cost
      })
      
      if (screenshotResult.pages) {
        for (const p of screenshotResult.pages) {
          if (p.dataUrl) {
            screenshots.push(p.dataUrl)
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to extract screenshots from PDF', err)
    }

    // Group pages into ~100KB chunks
    const chunks: string[] = []
    let currentChunk = ''
    for (const pageText of pages) {
      if (currentChunk.length + pageText.length > CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = ''
      }
      currentChunk += pageText + '\n\n'
    }
    if (currentChunk.length > 0) chunks.push(currentChunk)

    logger.info('Parsed PDF', { 
      pageCount, 
      chars: text.length, 
      screenshots: screenshots.length 
    })
    
    return { text, pageCount, chunks, pages, screenshots }
  })
}
