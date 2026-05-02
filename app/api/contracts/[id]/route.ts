import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/contracts/[id]')

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/contracts/[id]'>
) {
  const { id } = await ctx.params
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('contract_id', id)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Contract not found' }, { status: 404 })
    }
    return Response.json(data)
  } catch (err) {
    logger.error('Failed to fetch contract', { id, err })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
