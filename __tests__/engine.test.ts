import { expect, test, describe, beforeAll } from 'vitest'
import { runValidation } from '../lib/validation/engine'
import { ContractParameters } from '../lib/schemas/contract'
import { Invoice } from '../lib/schemas/invoice'

const mockContract: ContractParameters = {
  contract_id: "C001",
  contract_type: "LTSA",
  base_annual_fee: { value: 144000000, source_clause: "₹14,40,00,000 per annum payable monthly at ₹1,20,00,000 per month.", clause_reference: "Clause 4.1", page_number: 8, confidence: "high" },
  base_monthly_fee: { value: 12000000, source_clause: "₹14,40,00,000 per annum payable monthly at ₹1,20,00,000 per month.", clause_reference: "Clause 4.1", page_number: 8, confidence: "high" },
  escalation: { value: { type: "WPI", index_base_month: "January", effective_date: "April 1", cap_pct: 8, floor_pct: 0 }, source_clause: "The Base Annual Fee shall be escalated on April 1 each year by the WPI.", clause_reference: "Clause 5.2", page_number: 14, confidence: "high" },
  variable_component: { value: { rate_per_kwh: 0.04, billing_frequency: "Quarterly" }, source_clause: "₹0.04 per kWh of net energy generated.", clause_reference: "Clause 6.3", page_number: 18, confidence: "high" },
  availability_guarantee_pct: { value: 96.0, source_clause: "Contractor guarantees 96.0% turbine availability annually.", clause_reference: "Clause 7.1", page_number: 22, confidence: "high" },
  ld_rate_per_pp: { value: 0.5, source_clause: "0.5% of Annual Fee per percentage point shortfall below 96%.", clause_reference: "Clause 8.2", page_number: 27, confidence: "high" },
  ld_cap_pct: { value: 15, source_clause: "Maximum LD: 15% of Annual Fee per annum.", clause_reference: "Clause 8.2", page_number: 27, confidence: "high" },
  bonus_threshold_pct: { value: 98.0, source_clause: "1% of Annual Fee per percentage point above 98% availability.", clause_reference: "Clause 9.1", page_number: 31, confidence: "high" },
  bonus_rate_per_pp: { value: 1, source_clause: "1% of Annual Fee per percentage point above 98% availability.", clause_reference: "Clause 9.1", page_number: 31, confidence: "high" },
  payment_terms_days: { value: 45, source_clause: "Net 45 days from invoice date.", clause_reference: "Clause 10.1", page_number: 35, confidence: "high" },
  late_payment_interest: { value: "SBI base rate + 2%", source_clause: "SBI base rate + 2% per annum.", clause_reference: "Clause 11.3", page_number: 38, confidence: "high" },
  renewal_notice_months: { value: 12, source_clause: "12 months written notice.", clause_reference: "Clause 17.2", page_number: 45, confidence: "high" },
}

const mockGeneration = {
  total_kwh: 125000000,
  availability_pct: 98.5,
  period_start: "2024-01-01",
  period_end: "2024-03-31"
}

// INV-002: Billed incorrectly. Uses old WPI rate and ignores performance bonus opportunity.
const mockInvoice: Invoice = {
  invoice_id: "INV-002",
  contract_id: "C001",
  invoice_date: "2024-04-05",
  period_start: "2024-01-01",
  period_end: "2024-03-31",
  total_amount: 36000000, // Just 3 months of base fee, missing escalation and variable
  tax_amount: 6480000,
  currency: "INR",
  line_items: [
    { description: "O&M Base Fee Jan", amount: 12000000, category: "BaseFee" },
    { description: "O&M Base Fee Feb", amount: 12000000, category: "BaseFee" },
    { description: "O&M Base Fee Mar", amount: 12000000, category: "BaseFee" },
    { description: "Escalation", amount: 0, category: "Escalation" },
    { description: "Variable Generation", amount: 4000000, category: "Variable" } // Under-billed (125M * 0.04 = 5M)
  ]
}

describe('Deterministic Engine Validation (INV-002 Golden Scenario)', () => {
  let checks: Awaited<ReturnType<typeof runValidation>>

  beforeAll(async () => {
    checks = await runValidation(mockContract, mockInvoice, mockGeneration)
  })

  test('Check 1: Base Fee must MATCH', () => {
    const baseCheck = checks.find(c => c.check_id === 'CHECK_1_BASE_FEE')
    expect(baseCheck).toBeDefined()
    expect(baseCheck?.verdict).toBe('MATCH')
    expect(baseCheck?.actual_amount).toBe(36000000)
    expect(baseCheck?.gap_amount).toBe(0)
  })

  test('Check 2: WPI Escalation must be GAP', () => {
    const wpiCheck = checks.find(c => c.check_id === 'CHECK_2_WPI_ESCALATION')
    expect(wpiCheck).toBeDefined()
    // It should flag a gap since billed is 0 and expected is > 0 based on WPI logic
    expect(wpiCheck?.verdict).toBe('GAP')
    expect(wpiCheck?.gap_amount).toBeGreaterThan(0)
  })

  test('Check 3: Variable Component must be GAP (Under-billed)', () => {
    const varCheck = checks.find(c => c.check_id === 'CHECK_3_VARIABLE')
    expect(varCheck).toBeDefined()
    expect(varCheck?.expected_amount).toBe(5000000) // 125,000,000 * 0.04
    expect(varCheck?.actual_amount).toBe(4000000)
    expect(varCheck?.verdict).toBe('GAP')
    expect(varCheck?.gap_amount).toBe(1000000)
  })

  test('Check 5: Performance Bonus must be OPPORTUNITY', () => {
    const bonusCheck = checks.find(c => c.check_id === 'CHECK_5_BONUS')
    expect(bonusCheck).toBeDefined()
    expect(bonusCheck?.verdict).toBe('OPPORTUNITY')
    // Availability 98.5% > Threshold 98.0%. Rate is 1% per PP. 
    // Bonus = 0.5% of 144M = 720k.
    expect(bonusCheck?.expected_amount).toBe(720000) 
    expect(bonusCheck?.actual_amount).toBe(0)
    expect(bonusCheck?.opportunity_amount).toBe(720000)
  })
})
