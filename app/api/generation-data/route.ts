import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/generation-data')

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // contractId text to internal uuid
    const [contractRow] = await sql`SELECT id FROM contracts WHERE contract_id = ${data.contract_id} LIMIT 1`
    const internalId = contractRow?.id

    if (!internalId) return Response.json({ error: 'Contract not found' }, { status: 404 })

    const result = await sql`
      INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct, source)
      VALUES (
        ${internalId}, 
        ${data.period_start}, 
        ${data.period_end}, 
        ${data.total_kwh}, 
        ${data.availability_pct}, 
        'manual'
      )
      RETURNING id
    `
    
    return Response.json({ status: 'created', id: result[0].id }, { status: 201 })
  } catch (err) {
    logger.error('Failed to save generation data', err)
    return Response.json({ error: 'Failed to save generation data' }, { status: 500 })
  }
}
