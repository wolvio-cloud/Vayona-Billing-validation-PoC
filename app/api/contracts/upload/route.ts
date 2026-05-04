import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'

const logger = createLogger('api/contracts/upload')
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
    if (!file.name.endsWith('.pdf')) return Response.json({ error: 'Only PDF files accepted' }, { status: 400 })

    await mkdir(UPLOAD_DIR, { recursive: true })

    const contractId = `C${Date.now()}`
    const fileName = `${contractId}.pdf`
    const filePath = join(UPLOAD_DIR, fileName)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    let dbSuccess = false
    let row: any = null

    try {
      // 2-second timeout for DB check to prevent hanging
      const dbPromise = sql`
        INSERT INTO contracts (contract_id, display_name, pdf_storage_path, extraction_status)
        VALUES (${contractId}, ${file.name.replace('.pdf', '')}, ${filePath}, 'pending')
        RETURNING id, contract_id
      `
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2000))
      
      const result = await Promise.race([dbPromise, timeoutPromise]) as any[]
      row = result[0]
      dbSuccess = true
      logger.info('Contract uploaded to DB', { contractId })
    } catch (dbErr) {
      logger.warn('DB failover to MockStore', { contractId, reason: (dbErr as Error).message })
    }

    if (!dbSuccess) {
      mockStore.set(contractId, {
        contract_id: contractId,
        display_name: file.name.replace('.pdf', ''),
        pdf_storage_path: filePath,
        extraction_status: 'pending',
        created_at: new Date().toISOString()
      })
    }

    return Response.json({ 
      contract_id: contractId, 
      id: row?.id ?? 0,
      storage: dbSuccess ? 'postgres' : 'mock_db'
    }, { status: 201 })

  } catch (err) {
    logger.error('Upload failed', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
