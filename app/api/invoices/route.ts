import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'

const logger = createLogger('api/invoices')

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // contractId here might be the TEXT contract_id (e.g. C001) 
    // but the DB needs the UUID.
    const [contractRow] = await sql`SELECT id FROM contracts WHERE contract_id = ${data.contract_id} LIMIT 1`
    const internalId = contractRow?.id

    if (!internalId) {
       // Fallback to mockStore or return error
       logger.warn('Contract not found in DB, falling back to mockStore', { cid: data.contract_id })
    }

    try {
      const result = await sql`
        INSERT INTO invoices (
          invoice_id, 
          contract_id, 
          invoice_date, 
          period_start, 
          period_end, 
          line_items, 
          total, 
          status,
          source
        )
        VALUES (
          ${data.invoice_id}, 
          ${internalId}, 
          ${data.invoice_date}, 
          ${data.period_start}, 
          ${data.period_end}, 
          ${JSON.stringify(data.line_items)}, 
          ${data.total}, 
          'Pending',
          'manual'
        )
        RETURNING id
      `
      return Response.json({ status: 'created', id: result[0].id }, { status: 201 })
    } catch (dbErr) {
      logger.error('DB insert failed', dbErr)
      // MockStore save
      mockStore.set(`${data.contract_id}-${data.invoice_id}`, data)
      return Response.json({ status: 'created', id: data.invoice_id, storage: 'mock_db' }, { status: 201 })
    }

  } catch (err) {
    logger.error('Failed to create invoice', err)
    return Response.json({ error: 'Failed to save invoice' }, { status: 500 })
  }
}
