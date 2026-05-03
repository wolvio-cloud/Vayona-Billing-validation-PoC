'use server'

import fs from 'fs/promises'
import path from 'path'
import { ContractParameters } from './schemas/contract'
import { Invoice } from './schemas/invoice'

export async function getDemoContractParameters(contractId: string): Promise<ContractParameters | null> {
  const p = path.join(process.cwd(), 'demo_data', 'contracts', `${contractId}.json`)
  try {
    const content = await fs.readFile(p, 'utf-8')
    const parsed = JSON.parse(content)
    // Sanity check — ensure the JSON actually has required fields
    if (!parsed.base_annual_fee || !parsed.base_monthly_fee) {
      console.error(`[demo-data] ${contractId}.json is missing required fields!`, Object.keys(parsed))
      return null
    }
    return parsed as ContractParameters
  } catch (err) {
    console.warn(`[demo-data] Could not read ${contractId}.json, using inline fallback if available.`, err)
    // Inline fallback — only for C001 to guarantee demo always works
    if (contractId === 'C001') {
      return {
        contract_id: 'C001',
        contract_type: 'LTSA',
        base_annual_fee: { value: 144000000, source_clause: 'The Base Annual Fee shall be INR 14,40,00,000 per annum, payable monthly at INR 1,20,00,000 per month, on or before the 5th working day of each calendar month.', clause_reference: 'Clause 4.1', page_number: 8, confidence: 'high' },
        base_monthly_fee: { value: 12000000, source_clause: 'The Base Annual Fee shall be INR 14,40,00,000 per annum, payable monthly at INR 1,20,00,000 per month, on or before the 5th working day of each calendar month.', clause_reference: 'Clause 4.1', page_number: 8, confidence: 'high' },
        escalation: { value: { type: 'WPI', index_base_month: 'January', effective_date: 'April 1', cap_pct: 8, floor_pct: 0 }, source_clause: 'The Base Annual Fee shall be escalated on April 1 each year by the WPI for January, capped at 8% p.a.', clause_reference: 'Clause 5.2', page_number: 14, confidence: 'high' },
        variable_component: { value: { rate_per_kwh: 0.04, billing_frequency: 'Quarterly' }, source_clause: 'INR 0.04 per kWh of net energy generated, billed quarterly within 30 days of quarter end.', clause_reference: 'Clause 6.3', page_number: 18, confidence: 'high' },
        availability_guarantee_pct: { value: 96.0, source_clause: 'Service Provider guarantees 96.0% annual Wind Turbine Availability.', clause_reference: 'Clause 7.1', page_number: 22, confidence: 'high' },
        ld_rate_per_pp: { value: 0.5, source_clause: '0.5% of Annual Fee per percentage point shortfall below 96%. Maximum LD: 15% of Annual Fee per annum.', clause_reference: 'Clause 8.2', page_number: 27, confidence: 'high' },
        ld_cap_pct: { value: 15, source_clause: '0.5% of Annual Fee per percentage point shortfall below 96%. Maximum LD: 15% of Annual Fee per annum.', clause_reference: 'Clause 8.2', page_number: 27, confidence: 'high' },
        bonus_threshold_pct: { value: 98.0, source_clause: '1% of Annual Fee per percentage point above 98% availability. Maximum bonus: 5% of Annual Fee per annum.', clause_reference: 'Clause 9.1', page_number: 31, confidence: 'high' },
        bonus_rate_per_pp: { value: 1, source_clause: '1% of Annual Fee per percentage point above 98% availability. Maximum bonus: 5% of Annual Fee per annum.', clause_reference: 'Clause 9.1', page_number: 31, confidence: 'high' },
        payment_terms_days: { value: 45, source_clause: 'All invoices shall be paid within 45 days from the date of receipt.', clause_reference: 'Clause 10.1', page_number: 35, confidence: 'high' },
        late_payment_interest: { value: 'SBI base rate + 2%', source_clause: 'SBI Base Rate plus 2% per annum on overdue amounts.', clause_reference: 'Clause 11.3', page_number: 38, confidence: 'high' },
        renewal_notice_months: { value: 12, source_clause: '12 months written notice required to terminate or renegotiate.', clause_reference: 'Clause 17.2', page_number: 45, confidence: 'high' },
        validation_warnings: [
          "AMBIGUITY: Clause 4.1 states payment is due on '5th working day' while Schedule 2 states 'within 5 calendar days'. Recommend clarification.",
          "NOTE: WPI escalation effective date is April 1 — invoices Jan–Mar use prior-year WPI rate."
        ]
      }
    }
    return null
  }
}


export async function getDemoInvoice(invoiceId: string): Promise<Invoice | null> {
  try {
    const p = path.join(process.cwd(), 'demo_data', 'invoices', `${invoiceId}.json`)
    const content = await fs.readFile(p, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function getDemoGenerationData(contractId: string) {
  try {
    const p = path.join(process.cwd(), 'demo_data', 'generation', `gen-data.json`)
    const content = await fs.readFile(p, 'utf-8')
    const data = JSON.parse(content)
    if (data.contract_id === contractId) return data.monthly
    return null
  } catch {
    return null
  }
}
