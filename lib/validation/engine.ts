import type { ContractParameters } from '@/lib/schemas/contract'
import type { Invoice } from '@/lib/schemas/invoice'
import type { ValidationCheck } from '@/lib/schemas/validation'
import { lookupWPI } from './wpi-index'
import { calcEscalatedMonthlyFee, calcLiquidatedDamages, calcPerformanceBonus, calcVariableComponent } from './calculator'

export interface GenerationData {
  total_kwh: number
  availability_pct: number
  period_start: string
  period_end: string
}

function sumByCategory(invoice: Invoice, category: Invoice['line_items'][number]['category']): number {
  return invoice.line_items
    .filter((i) => i.category === category)
    .reduce((s, i) => s + i.amount, 0)
}

export function runValidation(
  params: ContractParameters,
  invoice: Invoice,
  generation?: GenerationData
): Omit<ValidationCheck, 'explanation'>[] {
  const checks: Omit<ValidationCheck, 'explanation'>[] = []

  // CHECK 1 — Base Fee
  {
    const expected = params.base_monthly_fee.value
    const actual = sumByCategory(invoice, 'BaseFee')
    const gap = expected - actual
    checks.push({
      check_id: 'CHECK_1_BASE_FEE',
      check_name: 'Base Fee',
      verdict: Math.abs(gap) < 100 ? 'MATCH' : 'GAP',
      expected_amount: expected,
      actual_amount: actual,
      gap_amount: Math.abs(gap) < 100 ? 0 : gap,
      opportunity_amount: null,
      clause_reference: params.base_monthly_fee.clause_reference,
      source_clause: params.base_monthly_fee.source_clause,
      page_number: params.base_monthly_fee.page_number,
      severity: Math.abs(gap) < 100 ? null : 'High',
    })
  }

  // CHECK 2 — WPI Escalation
  if (params.escalation?.value.type === 'WPI') {
    const esc = params.escalation
    const invoiceYear = new Date(invoice.invoice_date).getFullYear()
    const currentJanKey = `${invoiceYear}-01`
    const baseJanKey = `${invoiceYear - 1}-01`
    const currentWPI = lookupWPI(currentJanKey)
    const baseWPI = lookupWPI(baseJanKey)

    if (currentWPI && baseWPI) {
      const escalatedFee = calcEscalatedMonthlyFee({
        baseMonthlyFee: params.base_monthly_fee.value,
        currentJanWPI: currentWPI,
        baseJanWPI: baseWPI,
        capPct: esc.value.cap_pct,
      })
      const expectedEscalation = escalatedFee - params.base_monthly_fee.value
      const actualEscalation = sumByCategory(invoice, 'Escalation')

      const diff = Math.abs(actualEscalation - expectedEscalation)
      const verdict = actualEscalation === 0
        ? 'GAP'
        : diff > 1000 ? 'GAP' : 'MATCH'

      checks.push({
        check_id: 'CHECK_2_WPI_ESCALATION',
        check_name: 'WPI Escalation',
        verdict,
        expected_amount: expectedEscalation,
        actual_amount: actualEscalation,
        gap_amount: verdict === 'GAP' ? expectedEscalation - actualEscalation : 0,
        opportunity_amount: null,
        clause_reference: esc.clause_reference,
        source_clause: esc.source_clause,
        page_number: esc.page_number,
        severity: verdict === 'GAP' ? 'High' : null,
      })
    } else {
      checks.push({
        check_id: 'CHECK_2_WPI_ESCALATION',
        check_name: 'WPI Escalation',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: null,
        actual_amount: null,
        gap_amount: null,
        opportunity_amount: null,
        clause_reference: esc.clause_reference,
        source_clause: esc.source_clause,
        page_number: esc.page_number,
        severity: 'Medium',
      })
    }
  }

  // CHECK 3 — Variable Component
  if (params.variable_component && generation) {
    const vc = params.variable_component
    const expected = calcVariableComponent(generation.total_kwh, vc.value.rate_per_kwh)
    const actual = sumByCategory(invoice, 'Variable')
    const gap = expected - actual

    checks.push({
      check_id: 'CHECK_3_VARIABLE',
      check_name: 'Variable Component',
      verdict: actual === 0 ? 'GAP' : Math.abs(gap) < 100 ? 'MATCH' : 'GAP',
      expected_amount: expected,
      actual_amount: actual,
      gap_amount: gap > 0 ? gap : 0,
      opportunity_amount: null,
      clause_reference: vc.clause_reference,
      source_clause: vc.source_clause,
      page_number: vc.page_number,
      severity: gap > 0 ? 'High' : null,
    })
  }

  // CHECK 4 — LD Netting
  if (generation) {
    const guarantee = params.availability_guarantee_pct.value
    if (generation.availability_pct < guarantee) {
      const expectedLD = calcLiquidatedDamages({
        baseAnnualFee: params.base_annual_fee.value,
        ldRatePerPP: params.ld_rate_per_pp.value,
        ldCapPct: params.ld_cap_pct.value,
        guaranteePct: guarantee,
        actualAvailabilityPct: generation.availability_pct,
      })
      const actualLD = sumByCategory(invoice, 'LD')
      const shortfall = expectedLD - actualLD

      checks.push({
        check_id: 'CHECK_4_LD_NETTING',
        check_name: 'Liquidated Damages',
        verdict: shortfall > 1000 ? 'GAP' : 'MATCH',
        expected_amount: expectedLD,
        actual_amount: actualLD,
        gap_amount: shortfall > 1000 ? shortfall : 0,
        opportunity_amount: null,
        clause_reference: params.ld_rate_per_pp.clause_reference,
        source_clause: params.ld_rate_per_pp.source_clause,
        page_number: params.ld_rate_per_pp.page_number,
        severity: shortfall > 1000 ? 'Medium' : null,
      })
    }
  }

  // CHECK 5 — Performance Bonus
  if (params.bonus_threshold_pct && params.bonus_rate_per_pp && generation) {
    const threshold = params.bonus_threshold_pct.value
    if (generation.availability_pct >= threshold) {
      const expectedBonus = calcPerformanceBonus({
        baseAnnualFee: params.base_annual_fee.value,
        bonusRatePerPP: params.bonus_rate_per_pp.value,
        bonusThresholdPct: threshold,
        actualAvailabilityPct: generation.availability_pct,
      })
      const actualBonus = sumByCategory(invoice, 'Bonus')

      checks.push({
        check_id: 'CHECK_5_BONUS',
        check_name: 'Performance Bonus',
        verdict: actualBonus === 0 && expectedBonus > 0 ? 'OPPORTUNITY' : 'MATCH',
        expected_amount: expectedBonus,
        actual_amount: actualBonus,
        gap_amount: null,
        opportunity_amount: actualBonus === 0 ? expectedBonus : null,
        clause_reference: params.bonus_threshold_pct.clause_reference,
        source_clause: params.bonus_threshold_pct.source_clause,
        page_number: params.bonus_threshold_pct.page_number,
        severity: actualBonus === 0 && expectedBonus > 0 ? 'Medium' : null,
      })
    }
  }

  return checks
}
