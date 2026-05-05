import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/validation-runs/approve')

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  
  try {
    const body = await request.json()
    const { finding_id, action, fc_notes } = body

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 })
    }

    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const approvedBy = 'Financial Controller' // In a real app, this comes from auth context
    const approvedAt = new Date().toISOString()

    // We use a safe transaction-like query, or just update directly
    // The prompt requires we update the status, approved_by, approved_at, fc_notes
    
    // First, verify the run exists
    const runs = await sql`SELECT * FROM validation_runs WHERE id = ${id}`
    if (runs.length === 0) {
      return NextResponse.json({ error: 'Validation run not found' }, { status: 404 })
    }
    
    const run = runs[0]
    
    // Update the checks JSONB to include the approval status on the specific finding
    let checks = run.checks || []
    if (typeof checks === 'string') checks = JSON.parse(checks)
    
    if (finding_id) {
      checks = checks.map((check: any) => {
        if (check.check_id === finding_id) {
          return { ...check, status, fc_notes, approved_by: approvedBy, approved_at: approvedAt }
        }
        return check
      })
    }

    await sql`
      UPDATE validation_runs 
      SET 
        status = ${status},
        approved_by = ${approvedBy},
        approved_at = ${approvedAt},
        fc_notes = ${fc_notes || null},
        checks = ${JSON.stringify(checks)}
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: `Validation run ${status}`,
      status,
      approved_by: approvedBy,
      approved_at: approvedAt
    })
    
  } catch (err: any) {
    logger.error('Failed to approve validation run', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
