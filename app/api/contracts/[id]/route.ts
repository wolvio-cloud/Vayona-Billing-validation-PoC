import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'

const logger = createLogger('api/contracts/[id]')

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  
  try {
    // 1. Try Neon first
    if (process.env.DATABASE_URL) {
      // Find the internal ID first if 'id' is a string contract_id
      const rows = await sql`SELECT id FROM contracts WHERE contract_id = ${id} OR id::text = ${id} LIMIT 1`
      
      if (rows.length > 0) {
        const internalId = rows[0].id
        
        // Delete related data using both possible keys (to be safe across schema versions)
        await sql`DELETE FROM validation_runs WHERE contract_id = ${id} OR contract_id::text = ${internalId}`
        await sql`DELETE FROM invoices WHERE contract_id = ${id} OR contract_id::text = ${internalId}`
        await sql`DELETE FROM generation_data WHERE contract_id = ${id} OR contract_id::text = ${internalId}`
        await sql`DELETE FROM contract_clauses WHERE contract_id = ${id} OR contract_id::text = ${internalId}`
        
        // Finally delete the contract
        await sql`DELETE FROM contracts WHERE id = ${internalId}`
      }
      
      return NextResponse.json({ success: true, message: 'Contract and related data deleted from Neon' })
    }
    
    // 2. Fallback to mock store
    mockStore.deleteContract(id)
    return NextResponse.json({ success: true, message: 'Contract deleted from Mock Store' })

  } catch (err: any) {
    logger.error('Failed to delete contract', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
