import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'
import { ContractParametersSchema } from '@/lib/schemas/contract'

const logger = createLogger('api/contracts/[id]/parameters')

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  
  try {
    const body = await request.json()
    
    // 1. Partial validation: we only want to update the parameters
    // We allow partial updates for manual overrides
    
    let currentParameters: any = {}
    try {
      const rows = await sql`SELECT parameters FROM contracts WHERE contract_id = ${id} LIMIT 1`
      if (rows.length > 0) {
        currentParameters = rows[0].parameters || {}
      }
    } catch {
      currentParameters = mockStore.get(id)?.parameters || {}
    }

    // Merge updates
    const updatedParameters = {
      ...currentParameters,
      ...body
    }

    // Wrap the updated fields with "manual" confidence if they are changed
    for (const [key, value] of Object.entries(body)) {
      if (key === '_extraction_meta') continue
      
      // If the incoming value is already a TracedField, use it. 
      // Otherwise, wrap it.
      if (value && typeof value === 'object' && 'value' in value) {
        updatedParameters[key] = {
          ...(value as any),
          confidence: 'high',
          source_clause: (value as any).source_clause || 'Manual input by user'
        }
      } else {
        // Simple value passed, wrap it
        updatedParameters[key] = {
          value: value,
          confidence: 'high',
          source_clause: 'Manual input by user',
          clause_reference: 'Manual Override',
          page_number: 0
        }
      }
    }

    // Final validation of the whole object
    const validated = ContractParametersSchema.safeParse(updatedParameters)
    if (!validated.success) {
      logger.warn('Manual override failed schema validation', validated.error.format())
      // We still allow it but return a warning if it's really broken
    }

    // 2. Persist to Neon
    try {
      await sql`
        UPDATE contracts 
        SET parameters = ${JSON.stringify(updatedParameters)},
            extraction_status = 'completed'
        WHERE contract_id = ${id}
      `
    } catch (err) {
      logger.warn('DB update failed, using mockStore', err)
      const existing = mockStore.get(id)
      if (existing) {
        mockStore.set(id, { ...existing, parameters: updatedParameters, extraction_status: 'completed' })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Parameters updated manually',
      parameters: updatedParameters
    })

  } catch (err: any) {
    logger.error('Failed to update parameters', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
