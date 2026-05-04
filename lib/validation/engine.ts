import type { ContractParameters } from '@/lib/schemas/contract'
import type { Invoice } from '@/lib/schemas/invoice'
import type { ValidationCheck } from '@/lib/schemas/validation'
import { lookupIndex } from './indices'
import { calcEscalatedMonthlyFee, calcLiquidatedDamages, calcPerformanceBonus, calcVariableComponent } from './calculator'
import { formatINR } from '@/lib/utils'

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

function getFormulaProof(name: string, formula: string, result: string): string {
  return `FORMULA: ${name}\n${formula}\nRESULT: ${result}`
}

export async function runValidation(
  params: ContractParameters,
  invoice: Invoice,
  generation?: GenerationData
): Promise<ValidationCheck[]> {
  const checks: ValidationCheck[] = []

  // CHECK 1 — Base Fee
  if (params.base_monthly_fee?.value != null) {
    const numMonths = getMonthsDiff(invoice.period_start, invoice.period_end)
    const expected = params.base_monthly_fee.value * numMonths
    const actual = sumByCategory(invoice, 'BaseFee')
    const gap = expected - actual
    const verdict = Math.abs(gap) < 100 ? 'MATCH' : 'GAP'
    
    checks.push({
      check_id: 'CHECK_1_BASE_FEE',
      check_name: 'Base Fee',
      verdict,
      expected_amount: expected,
      actual_amount: actual,
      gap_amount: verdict === 'GAP' ? gap : 0,
      opportunity_amount: null,
      clause_reference: params.base_monthly_fee.clause_reference,
      source_clause: params.base_monthly_fee.source_clause,
      page_number: params.base_monthly_fee.page_number,
      explanation: getFormulaProof(
        'Base Fee Calculation',
        `${formatINR(params.base_monthly_fee.value)}/month × ${numMonths} months`,
        formatINR(expected)
      ),
      severity: verdict === 'GAP' ? 'High' : null,
      confidence: 'High'
    })
  }

  // CHECK 2 — Escalation (WPI/CPI)
  if (params.escalation?.value && params.base_monthly_fee?.value != null) {
    const esc = params.escalation.value
    const indexType = esc.type as 'WPI' | 'CPI'
    if (indexType !== 'None') {
      const invoiceYear = new Date(invoice.invoice_date).getFullYear()
      const baseMonth = esc.index_base_month || 'January'
      const monthMap: Record<string, string> = { 'January': '01', 'April': '04' } // simplified for demo
      const mm = monthMap[baseMonth] || '01'
      
      const currentKey = `${invoiceYear}-${mm}`
      const baseKey = `${invoiceYear - 1}-${mm}`
      const currentIndex = lookupIndex(indexType, currentKey)
      const baseIndex = lookupIndex(indexType, baseKey)

      if (currentIndex && baseIndex) {
        const { value: escalatedFee, rawChange, factor } = calcEscalatedMonthlyFee({
          baseMonthlyFee: params.base_monthly_fee.value,
          currentIndexValue: currentIndex,
          baseIndexValue: baseIndex,
          capPct: esc.cap_pct,
          floorPct: esc.floor_pct
        })

        const expectedEscalation = escalatedFee - params.base_monthly_fee.value
        const actualEscalation = sumByCategory(invoice, 'Escalation')
        const diff = Math.abs(actualEscalation - expectedEscalation)
        // Tolerance set to ₹500 to handle different indexation rounding methods in the field
        const verdict = actualEscalation === 0 && expectedEscalation > 500 ? 'GAP' : diff > 500 ? 'GAP' : 'MATCH'

        checks.push({
          check_id: 'CHECK_2_ESCALATION',
          check_name: `${indexType} Escalation`,
          verdict,
          expected_amount: expectedEscalation,
          actual_amount: actualEscalation,
          gap_amount: verdict === 'GAP' ? expectedEscalation - actualEscalation : 0,
          opportunity_amount: null,
          clause_reference: params.escalation.clause_reference,
          source_clause: params.escalation.source_clause,
          page_number: params.escalation.page_number,
          explanation: getFormulaProof(
            `${indexType} Indexation`,
            `Base: ${baseIndex} (${baseMonth} ${invoiceYear-1}) → Current: ${currentIndex} (${baseMonth} ${invoiceYear})\nRaw Change: ${(rawChange * 100).toFixed(2)}% | Applied (Cap ${esc.cap_pct}%): ${((factor-1)*100).toFixed(2)}%\n${formatINR(params.base_monthly_fee.value)} × ${factor.toFixed(4)}`,
            formatINR(escalatedFee)
          ),
          severity: verdict === 'GAP' ? 'High' : null,
          confidence: 'High'
        })
      }
    }
  }

  // CHECK 3 — Variable Component
  if (params.variable_component?.value && generation) {
    const vc = params.variable_component.value
    const expected = calcVariableComponent(generation.total_kwh, vc.rate_per_kwh)
    const actual = sumByCategory(invoice, 'Variable')
    const gap = expected - actual
    const verdict = actual === 0 && expected > 0 ? 'GAP' : Math.abs(gap) < 100 ? 'MATCH' : 'GAP'

    checks.push({
      check_id: 'CHECK_3_VARIABLE',
      check_name: 'Variable Component',
      verdict,
      expected_amount: expected,
      actual_amount: actual,
      gap_amount: gap > 0 ? gap : 0,
      opportunity_amount: null,
      clause_reference: params.variable_component.clause_reference,
      source_clause: params.variable_component.source_clause,
      page_number: params.variable_component.page_number,
      explanation: getFormulaProof(
        'Variable Fee (Generation)',
        `${generation.total_kwh.toLocaleString()} kWh × ₹${vc.rate_per_kwh}/kWh`,
        formatINR(expected)
      ),
      severity: gap > 0 ? 'High' : null,
      confidence: 'High'
    })
  }

  // CHECK 4 — Liquidated Damages (LD)
  if (generation && params.availability_guarantee_pct?.value != null && params.ld_rate_per_pp?.value != null) {
    const guarantee = params.availability_guarantee_pct.value
    if (generation.availability_pct < guarantee && params.base_annual_fee?.value != null) {
      const { value: expectedLD, shortfallPP, rawAmount, capAmount } = calcLiquidatedDamages({
        baseAnnualFee: params.base_annual_fee.value,
        ldRatePerPP: params.ld_rate_per_pp.value,
        ldCapPct: params.ld_cap_pct?.value || 10,
        guaranteePct: guarantee,
        actualAvailabilityPct: generation.availability_pct
      })
      const actualLD = sumByCategory(invoice, 'LD')
      const gap = expectedLD - actualLD
      const verdict = gap > 1000 ? 'GAP' : 'MATCH'

      checks.push({
        check_id: 'CHECK_4_LD',
        check_name: 'Liquidated Damages',
        verdict,
        expected_amount: expectedLD,
        actual_amount: actualLD,
        gap_amount: verdict === 'GAP' ? gap : 0,
        opportunity_amount: null,
        clause_reference: params.ld_rate_per_pp.clause_reference,
        source_clause: params.ld_rate_per_pp.source_clause,
        page_number: params.ld_rate_per_pp.page_number,
        explanation: getFormulaProof(
          'LD Calculation',
          `Shortfall: ${guarantee}% - ${generation.availability_pct.toFixed(2)}% = ${shortfallPP.toFixed(2)} PP\nRaw: ${shortfallPP.toFixed(2)} PP × ${params.ld_rate_per_pp.value}% × ${formatINR(params.base_annual_fee.value)} = ${formatINR(rawAmount)}\nCap applied: ${formatINR(capAmount)}`,
          formatINR(expectedLD)
        ),
        severity: verdict === 'GAP' ? 'Medium' : null,
        confidence: 'High'
      })
    }
  }

  // CHECK 5 — Performance Bonus
  if (generation && params.bonus_threshold_pct?.value != null && params.bonus_rate_per_pp?.value != null) {
    const threshold = params.bonus_threshold_pct.value
    if (generation.availability_pct > threshold && params.base_annual_fee?.value != null) {
      const { value: expectedBonus, excessPP, rawAmount, capAmount } = calcPerformanceBonus({
        baseAnnualFee: params.base_annual_fee.value,
        bonusRatePerPP: params.bonus_rate_per_pp.value,
        bonusThresholdPct: threshold,
        actualAvailabilityPct: generation.availability_pct
      })
      const actualBonus = sumByCategory(invoice, 'Bonus')
      const verdict = actualBonus === 0 && expectedBonus > 0 ? 'OPPORTUNITY' : 'MATCH'

      checks.push({
        check_id: 'CHECK_5_BONUS',
        check_name: 'Performance Bonus',
        verdict,
        expected_amount: expectedBonus,
        actual_amount: actualBonus,
        gap_amount: null,
        opportunity_amount: verdict === 'OPPORTUNITY' ? expectedBonus : 0,
        clause_reference: params.bonus_threshold_pct.clause_reference,
        source_clause: params.bonus_threshold_pct.source_clause,
        page_number: params.bonus_threshold_pct.page_number,
        explanation: getFormulaProof(
          'Bonus Calculation',
          `Excess: ${generation.availability_pct.toFixed(2)}% - ${threshold}% = ${excessPP.toFixed(2)} PP\nRaw: ${excessPP.toFixed(2)} PP × ${params.bonus_rate_per_pp.value}% × ${formatINR(params.base_annual_fee.value)} = ${formatINR(rawAmount)}`,
          formatINR(expectedBonus)
        ),
        severity: verdict === 'OPPORTUNITY' ? 'Medium' : null,
        confidence: 'High'
      })
    }
  }

  // CHECK 6 — GST Correctness
  {
    const expectedGST = Math.round(invoice.subtotal * (invoice.gst_rate / 100))
    const actualGST = invoice.gst_amount
    const diff = Math.abs(actualGST - expectedGST)
    const verdict = diff > 10 ? 'GAP' : 'MATCH'
    
    checks.push({
      check_id: 'CHECK_6_GST',
      check_name: 'GST Correctness',
      verdict,
      expected_amount: expectedGST,
      actual_amount: actualGST,
      gap_amount: verdict === 'GAP' ? actualGST - expectedGST : 0,
      opportunity_amount: null,
      clause_reference: 'GST Act 2017',
      source_clause: `GST at ${invoice.gst_rate}% on taxable value of ${formatINR(invoice.subtotal)}.`,
      page_number: 0,
      explanation: getFormulaProof(
        'GST Calculation',
        `${formatINR(invoice.subtotal)} × ${invoice.gst_rate}%`,
        formatINR(expectedGST)
      ),
      severity: verdict === 'GAP' ? 'Medium' : null,
      confidence: 'High'
    })
  }

  return checks
}
