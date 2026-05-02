import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'

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
    if (!row) return Response.json({ error: 'Contract not found' }, { status: 404 })
    return Response.json(row)
  } catch (err) {
    logger.error('Failed to fetch contract', { id, err })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
