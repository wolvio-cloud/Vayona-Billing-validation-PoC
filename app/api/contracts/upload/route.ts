import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/contracts/upload')
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

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

    const [row] = await sql`
      INSERT INTO contracts (contract_id, display_name, pdf_storage_path, extraction_status)
      VALUES (${contractId}, ${file.name.replace('.pdf', '')}, ${filePath}, 'pending')
      RETURNING id, contract_id
    `

    logger.info('Contract uploaded', { contractId, filePath })
    return Response.json({ contract_id: contractId, id: row.id }, { status: 201 })
  } catch (err) {
    logger.error('Upload failed', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
