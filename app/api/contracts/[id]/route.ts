import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'

const logger = createLogger('api/contracts/[id]')

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/contracts/[id]'>
) {
  const { id } = await ctx.params
  try {
    const [row] = await sql`
      SELECT * FROM contracts WHERE contract_id = ${id} LIMIT 1
    `
    if (!row) {
      const mock = mockStore.get(id)
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

