import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'

const logger = createLogger('api/contracts/upload')
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

export const dynamic = 'force-dynamic'

import { parsePDF } from '@/lib/pdf/parse'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
    
    await mkdir(UPLOAD_DIR, { recursive: true })
    const contractId = `C-${uuidv4().substring(0, 8)}`
    const filePath = join(UPLOAD_DIR, `${contractId}.pdf`)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // ── QUALITY CHECKS ──
    const { text } = await parsePDF(buffer)
    if (text.length < 800) {
      return Response.json({ 
        error: "Scanned PDF detected. Upload text-searchable version." 
      }, { status: 422 })
    }

    const keywords = ['agreement', 'contract', 'service', 'terms', 'fee', 'clause']
    const hasKeywords = keywords.some(k => text.toLowerCase().includes(k))
    const warning = hasKeywords ? null : "Document may not be a service agreement."

    const truncatedText = text.length > 100000 ? text.substring(0, 100000) : text

    let dbSuccess = false
    let row: any = null

    try {
      const result = await sql`
        INSERT INTO contracts (contract_id, display_name, pdf_storage_path, raw_text, extraction_status)
        VALUES (${contractId}, ${file.name}, ${filePath}, ${truncatedText}, 'pending')
        RETURNING id, contract_id
      `
      row = result[0]
      dbSuccess = true
    } catch (dbErr) {
      logger.warn('DB failover to MockStore', { contractId, reason: (dbErr as Error).message })
    }

    if (!dbSuccess) {
      mockStore.set(contractId, {
        contract_id: contractId,
        display_name: file.name,
        pdf_storage_path: filePath,
        raw_text: truncatedText,
        extraction_status: 'pending',
        created_at: new Date().toISOString()
      })
    }

    return Response.json({ 
      contract_id: contractId, 
      id: row?.id ?? contractId,
      warning,
      storage: dbSuccess ? 'neon' : 'mock_db'
    }, { status: 201 })

  } catch (err) {
    logger.error('Upload failed', err)
    return Response.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
