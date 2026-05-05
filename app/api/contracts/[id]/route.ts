import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'

const logger = createLogger('api/contracts/[id]')

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  try {
    const [row] = await sql`
      SELECT * FROM contracts WHERE contract_id = ${id} LIMIT 1
    `
    const mock = mockStore.get(id)
    
    // Hybrid logic: If cloud says pending but mock says completed, use mock!
    if (row && mock && mock.extraction_status === 'completed' && row.extraction_status !== 'completed') {
       return Response.json(mock)
    }

    if (!row) {
      if (mock) return Response.json(mock)
      return Response.json({ error: 'Contract not found' }, { status: 404 })
    }
    return Response.json(row)
  } catch (err) {
    const mock = mockStore.get(id)
    if (mock) return Response.json(mock)
    
    logger.error('Failed to fetch contract', { id, err })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  try {
    const body = await request.json()
    const { field, value } = body

    if (!field) return Response.json({ error: 'Field name required' }, { status: 400 })

    // Fetch existing parameters
    const [row] = await sql`SELECT parameters FROM contracts WHERE contract_id = ${id} LIMIT 1`
    const parameters = row?.parameters || {}

    // Update specific field with manual metadata
    parameters[field] = {
      value,
      confidence: 'manual',
      source_clause: 'Entered manually — verify against document',
      clause_reference: 'Manual Override',
      page_number: 0
    }

    try {
      await sql`UPDATE contracts SET parameters = ${JSON.stringify(parameters)} WHERE contract_id = ${id}`
    } catch {
      const mock = mockStore.get(id) || {}
      mockStore.set(id, { ...mock, parameters })
    }

    return Response.json({ status: 'updated', field, value })
  } catch (err) {
    logger.error('Failed to update parameters', err)
    return Response.json({ error: 'Update failed' }, { status: 500 })
  }
}

