import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/contracts/upload')

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!file.name.endsWith('.pdf')) {
      return Response.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const contractId = `C${Date.now()}`
    const storagePath = `contracts/${contractId}.pdf`

    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('contract-pdfs')
      .upload(storagePath, bytes, { contentType: 'application/pdf' })

    if (uploadError) {
      logger.error('Storage upload failed', uploadError)
      return Response.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data, error: dbError } = await supabase
      .from('contracts')
      .insert({
        contract_id: contractId,
        display_name: file.name.replace('.pdf', ''),
        pdf_storage_path: storagePath,
        extraction_status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      logger.error('DB insert failed', dbError)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    logger.info('Contract uploaded', { contractId, storagePath })
    return Response.json({ contract_id: contractId, id: data.id }, { status: 201 })
  } catch (err) {
    logger.error('Unexpected error in upload', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
