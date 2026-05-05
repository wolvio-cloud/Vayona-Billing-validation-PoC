import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api/contracts/[id]/sap-payload')

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  
  try {
    // 1. Fetch the latest validation run for this contract
    const runs = await sql`
      SELECT * FROM validation_runs 
      WHERE contract_id = ${id} 
      ORDER BY run_at DESC 
      LIMIT 1
    `
    
    if (runs.length === 0) {
      return NextResponse.json({ error: 'No validation run found for this contract' }, { status: 404 })
    }
    
    const run = runs[0]
    
    // 2. Ensure it is approved
    if (run.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'SAP payload cannot be generated. Validation run must be APPROVED by Financial Controller.' 
      }, { status: 403 })
    }

    // 3. Fetch invoice and contract metadata
    const contracts = await sql`SELECT * FROM contracts WHERE contract_id = ${id} LIMIT 1`
    const invoices = await sql`SELECT * FROM invoices WHERE invoice_id = ${run.invoice_id} LIMIT 1`
    
    const contract = contracts[0]
    const invoice = invoices[0]

    // 4. Generate structured SAP Payload
    const payload = {
      DOCUMENT_HEADER: {
        COMP_CODE: 'WOLVIO01',
        DOC_DATE: new Date().toISOString().split('T')[0],
        PSTNG_DATE: new Date().toISOString().split('T')[0],
        DOC_TYPE: 'KR', // Vendor Invoice
        REF_DOC_NO: invoice?.invoice_id || 'UNKNOWN',
        HEADER_TXT: `Validated by Wolvio AI - Run ${run.id}`
      },
      VENDOR_ITEM: {
        VENDOR_NO: contract?.counterparty || 'VENDOR001',
        GL_ACCOUNT: '400000',
        AMOUNT: invoice?.total?.toString() || '0.00',
        CURRENCY: 'INR',
        COST_CENTER: 'CC_WIND_01'
      },
      ADJUSTMENTS: {
        GAPS_DETECTED: run.total_gap_amount,
        OPPORTUNITIES: run.total_opportunity_amount,
        APPROVED_BY: run.approved_by,
        APPROVAL_DATE: run.approved_at,
        FC_NOTES: run.fc_notes || ''
      },
      STATUS: 'READY_FOR_POSTING'
    }

    return NextResponse.json({
      success: true,
      payload
    })
    
  } catch (err: any) {
    logger.error('Failed to generate SAP payload', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
