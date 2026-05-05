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
      const rows = await sql`SELECT id FROM contracts WHERE contract_id::text = ${id} OR id::text = ${id} LIMIT 1`
      
      if (rows.length > 0) {
        const internalId = rows[0].id
        
        // Delete related data using both possible keys (to be safe across schema versions)
        await sql`DELETE FROM validation_runs WHERE contract_id::text = ${id} OR contract_id::text = ${internalId}`
        await sql`DELETE FROM invoices WHERE contract_id::text = ${id} OR contract_id::text = ${internalId}`
        await sql`DELETE FROM generation_data WHERE contract_id::text = ${id} OR contract_id::text = ${internalId}`
        await sql`DELETE FROM contract_clauses WHERE contract_id::text = ${id} OR contract_id::text = ${internalId}`
        
        // Finally delete the contract
        await sql`DELETE FROM contracts WHERE id::text = ${internalId}`
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

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  
  try {
    let contract: any
    
    // 1. Try Neon
    if (process.env.DATABASE_URL) {
      const rows = await sql`SELECT * FROM contracts WHERE contract_id::text = ${id} OR id::text = ${id} LIMIT 1`
      contract = rows[0]
    }
    
    // 2. Fallback to mockStore
    if (!contract) {
      contract = mockStore.get(id)
    }

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Add stage_index helper for frontend
    const currentStep = contract.parameters?.current_step || ''
    let stageIndex = 0
    if (currentStep.includes('Scan')) stageIndex = 1
    else if (currentStep.includes('Detect')) stageIndex = 2
    else if (currentStep.includes('Extract')) stageIndex = 3
    else if (currentStep.includes('Validat')) stageIndex = 4
    else if (currentStep.includes('Scoring')) stageIndex = 5
    else if (currentStep.includes('Build')) stageIndex = 6
    else if (currentStep.includes('Complete') || contract.extraction_status === 'completed') stageIndex = 7

    return NextResponse.json({
      ...contract,
      stage_index: stageIndex
    })

  } catch (err: any) {
    logger.error('Failed to fetch contract', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
