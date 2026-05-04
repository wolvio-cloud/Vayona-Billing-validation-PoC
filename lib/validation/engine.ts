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

function getMonthsDiff(start: string | undefined, end: string | undefined): number {
  if (!start || !end) return 1
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 1
  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12
  months -= startDate.getMonth()
  months += endDate.getMonth()
  return months <= 0 ? 1 : months + 1
}

export async function runValidation(
  params: ContractParameters,
  invoice: Invoice,
  generation?: GenerationData
): Promise<Omit<ValidationCheck, 'explanation'>[]> {
  const checks: Omit<ValidationCheck, 'explanation'>[] = []

  // CHECK 1 — Base Fee
  if (params.base_monthly_fee?.value != null) {
    const numMonths = getMonthsDiff(invoice.period_start, invoice.period_end)
    const expected = params.base_monthly_fee.value * numMonths
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
  if (params.escalation?.value?.type === 'WPI') {
    const esc = params.escalation
    const invoiceYear = new Date(invoice.invoice_date).getFullYear()
    const currentJanKey = `${invoiceYear}-01`
    const baseJanKey = `${invoiceYear - 1}-01`
    const currentWPI = lookupWPI(currentJanKey)
    const baseWPI = lookupWPI(baseJanKey)

    if (currentWPI && baseWPI && params.base_monthly_fee.value !== null) {
      const escalatedFee = calcEscalatedMonthlyFee({
        baseMonthlyFee: params.base_monthly_fee.value,
        currentJanWPI: currentWPI,
        baseJanWPI: baseWPI,
        capPct: esc.value!.cap_pct,
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
  if (params.variable_component?.value && generation) {
    const vc = params.variable_component
    const expected = calcVariableComponent(generation.total_kwh, vc.value!.rate_per_kwh)
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
    const guarantee = params.availability_guarantee_pct?.value
    if (guarantee != null && generation.availability_pct < guarantee && params.base_annual_fee?.value != null && params.ld_rate_per_pp?.value != null && params.ld_cap_pct?.value != null) {
      const expectedLD = calcLiquidatedDamages({
        baseAnnualFee: params.base_annual_fee.value!,
        ldRatePerPP: params.ld_rate_per_pp.value!,
        ldCapPct: params.ld_cap_pct.value!,
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
    if (threshold !== null && generation.availability_pct >= threshold && params.base_annual_fee.value !== null && params.bonus_rate_per_pp?.value !== null) {
      const expectedBonus = calcPerformanceBonus({
        baseAnnualFee: params.base_annual_fee.value!,
        bonusRatePerPP: params.bonus_rate_per_pp!.value!,
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

  // CHECK 6 — GST Correctness
  {
    const expectedGST = Math.round(invoice.subtotal * (invoice.gst_rate / 100))
    const actualGST = invoice.gst_amount
    const diff = Math.abs(actualGST - expectedGST)
    const gstClause = 'GST Act, 2017 — CGST + SGST @ stated rate on taxable value'
    if (diff > 1) {
      checks.push({
        check_id: 'CHECK_6_GST',
        check_name: 'GST Correctness',
        verdict: 'GAP',
        expected_amount: expectedGST,
        actual_amount: actualGST,
        gap_amount: actualGST - expectedGST,
        opportunity_amount: null,
        clause_reference: 'GST Act 2017 / Invoice',
        source_clause: gstClause,
        page_number: 0,
        severity: diff > 10000 ? 'High' : 'Low',
      })
    } else {
      checks.push({
        check_id: 'CHECK_6_GST',
        check_name: 'GST Correctness',
        verdict: 'MATCH',
        expected_amount: expectedGST,
        actual_amount: actualGST,
        gap_amount: 0,
        opportunity_amount: null,
        clause_reference: 'GST Act 2017 / Invoice',
        source_clause: gstClause,
        page_number: 0,
        severity: null,
      })
    }
  }

  // CHECK 7 — Payment Terms Breach (days overdue → late interest exposure)
  if (params.payment_terms_days?.value != null && params.late_payment_interest?.value != null) {
    const dueDate = new Date(invoice.invoice_date)
    dueDate.setDate(dueDate.getDate() + params.payment_terms_days.value)
    const today = new Date()
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))

    if (daysOverdue > 0 && invoice.status !== 'Paid') {
      // Rough interest exposure: subtotal × 15% p.a. (SBI base ~10% + 2% spread, simplified) × days/365
      const annualRate = 0.15
      const interestExposure = Math.round(invoice.subtotal * annualRate * (daysOverdue / 365))
      checks.push({
        check_id: 'CHECK_7_PAYMENT_BREACH',
        check_name: 'Payment Terms Breach',
        verdict: 'GAP',
        expected_amount: 0,
        actual_amount: interestExposure,
        gap_amount: interestExposure,
        opportunity_amount: null,
        clause_reference: params.payment_terms_days.clause_reference,
        source_clause: `Invoice ${invoice.invoice_id} due ${dueDate.toDateString()} — ${daysOverdue} days overdue. Late interest: ${params.late_payment_interest.value}.`,
        page_number: params.payment_terms_days.page_number,
        severity: daysOverdue > 30 ? 'High' : 'Medium',
      })
    }
  }

  // CHECK 9 — Escalation Cap/Floor Enforcement
  if (params.escalation?.value?.type === 'WPI' && params.base_monthly_fee?.value != null) {
    const esc = params.escalation.value
    const invoiceYear = new Date(invoice.invoice_date).getFullYear()
    const currentJanKey = `${invoiceYear}-01`
    const baseJanKey = `${invoiceYear - 1}-01`
    const { lookupWPI } = await import('./wpi-index')
    const currentWPI = lookupWPI(currentJanKey)
    const baseWPI = lookupWPI(baseJanKey)
    if (currentWPI && baseWPI) {
      const rawRate = ((currentWPI - baseWPI) / baseWPI) * 100
      const appliedRate = Math.max(esc.floor_pct ?? 0, Math.min(esc.cap_pct, rawRate))
      const capBreached = rawRate > esc.cap_pct
      const floorBreached = rawRate < (esc.floor_pct ?? 0)
      if (capBreached || floorBreached) {
        checks.push({
          check_id: 'CHECK_9_CAP_FLOOR',
          check_name: 'Escalation Cap/Floor',
          verdict: 'MATCH',
          expected_amount: appliedRate,
          actual_amount: rawRate,
          gap_amount: 0,
          opportunity_amount: null,
          clause_reference: esc.cap_pct != null ? params.escalation.clause_reference : 'N/A',
          source_clause: capBreached
            ? `Raw WPI change ${rawRate.toFixed(2)}% exceeds cap of ${esc.cap_pct}%. Applied rate limited to ${appliedRate.toFixed(2)}%.`
            : `Raw WPI change ${rawRate.toFixed(2)}% is below floor of ${esc.floor_pct}%. Minimum rate ${appliedRate.toFixed(2)}% applied.`,
          page_number: params.escalation.page_number,
          severity: 'Low',
        })
      }
    }
  }

  return checks
}

