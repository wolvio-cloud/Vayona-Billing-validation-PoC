import { createLogger } from '@/lib/logger'

const logger = createLogger('pdf-parse')
const CHUNK_SIZE = 100_000

export interface ParsedPDF {
  text: string
  pageCount: number
  chunks: string[]
  pages: string[]
}

/**
 * Polyfill browser globals required by pdfjs-dist v5 in Node.js.
 * Must be called before any pdfjs/pdf-parse import.
 */
function polyfillForNode() {
  const g = globalThis as any
  if (typeof g.DOMMatrix === 'undefined') {
    // Minimal DOMMatrix stub — pdfjs uses this for canvas transforms.
    // We don't need real math here since we're only extracting text.
    g.DOMMatrix = class DOMMatrix {
      a=1; b=0; c=0; d=1; e=0; f=0
      m11=1; m12=0; m13=0; m14=0
      m21=0; m22=1; m23=0; m24=0
      m31=0; m32=0; m33=1; m34=0
      m41=0; m42=0; m43=0; m44=1
      is2D=true; isIdentity=true
      constructor(_init?: string | number[]) {}
      static fromMatrix(m: any) { return new g.DOMMatrix() }
      static fromFloat32Array(a: Float32Array) { return new g.DOMMatrix() }
      static fromFloat64Array(a: Float64Array) { return new g.DOMMatrix() }
      multiply() { return this }
      translate() { return this }
      scale() { return this }
      rotate() { return this }
      inverse() { return this }
      flipX() { return this }
      flipY() { return this }
      skewX() { return this }
      skewY() { return this }
      transformPoint(p: any) { return p }
      toFloat32Array() { return new Float32Array(16) }
      toFloat64Array() { return new Float64Array(16) }
      toString() { return 'matrix(1, 0, 0, 1, 0, 0)' }
    }
  }
  if (typeof g.DOMPoint === 'undefined') {
    g.DOMPoint = class DOMPoint {
      x=0; y=0; z=0; w=1
      constructor(x=0, y=0, z=0, w=1) { this.x=x; this.y=y; this.z=z; this.w=w }
      static fromPoint(p: any) { return new g.DOMPoint(p?.x, p?.y, p?.z, p?.w) }
      matrixTransform() { return this }
      toJSON() { return {x:this.x,y:this.y,z:this.z,w:this.w} }
    }
  }
  if (typeof g.Path2D === 'undefined') {
    g.Path2D = class Path2D {
      constructor(_path?: any) {}
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
    }
  }
  if (typeof g.ImageData === 'undefined') {
    g.ImageData = class ImageData {
      data: Uint8ClampedArray
      width: number
      height: number
      constructor(w: number, h: number) {
        this.width = w; this.height = h
        this.data = new Uint8ClampedArray(w * h * 4)
      }
    }
  }
}

// Lazy-loaded pdf-parse (avoids static analysis crash during Next.js build)
let pdfParse: any = null

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  // Apply polyfills before any pdfjs code runs
  polyfillForNode()

  if (!pdfParse) {
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    const mod = require('pdf-parse')
    pdfParse = mod.PDFParse
  }

  return logger.timed('parsePDF', async () => {
    const parser = new pdfParse({ data: buffer, verbosity: 0 })
    const result = await parser.getText()
    
    const rawText: string = result.text
    const pageCount: number = result.total

    // Use structured pages from the new API
    const pages = result.pages.map((p: any) => 
      p.text.replace(/\s+/g, ' ').trim()
    ).filter((p: string) => p.length > 0)

    const text = pages.join(' ')

    // Group pages into ~100KB chunks for LLM context
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

    logger.info('Parsed PDF (page-aware)', { pageCount, chars: text.length, chunks: chunks.length })
    return { text, pageCount, chunks, pages }
  })
}
