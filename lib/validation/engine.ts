import type { ContractParameters } from '@/lib/schemas/contract'
import type { Invoice } from '@/lib/schemas/invoice'
import type { ValidationCheck } from '@/lib/schemas/validation'
import { lookupIndex } from './indices'
import { calcEscalatedMonthlyFee, calcLiquidatedDamages, calcPerformanceBonus, calcVariableComponent } from './calculator'
import { formatINR } from '../utils'

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
  try {
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
    } else {
      checks.push({
        check_id: 'CHECK_1_BASE_FEE',
        check_name: 'Base Fee',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
        clause_reference: params.base_monthly_fee?.clause_reference || 'N/A',
        source_clause: 'Base fee not found in contract',
        page_number: params.base_monthly_fee?.page_number || 0,
        explanation: 'Base monthly fee parameter is missing from the contract extraction.',
        severity: 'High', confidence: 'High'
      })
    }
  } catch (err: any) {
    checks.push({
      check_id: 'CHECK_1_BASE_FEE',
      check_name: 'Base Fee',
      verdict: 'ERROR',
      expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
      clause_reference: params.base_monthly_fee?.clause_reference || 'N/A',
      source_clause: 'Check failed: ' + err.message,
      page_number: 0, explanation: 'Error in calculation engine.',
      severity: 'High', confidence: 'Low'
    })
  }

  // CHECK 2 — Escalation (WPI/CPI)
  try {
    if (params.escalation?.value && params.base_monthly_fee?.value != null) {
      const esc = params.escalation.value
      const indexType = esc.type
      if (indexType === 'WPI' || indexType === 'CPI') {
        const invoiceYear = new Date(invoice.invoice_date).getFullYear()
        const baseMonth = esc.index_base_month || 'January'
        const monthMap: Record<string, string> = { 'January': '01', 'April': '04' }
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
    } else {
      checks.push({
        check_id: 'CHECK_2_ESCALATION',
        check_name: 'Escalation',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
        clause_reference: params.escalation?.clause_reference || 'N/A',
        source_clause: 'Escalation terms not found',
        page_number: params.escalation?.page_number || 0,
        explanation: 'WPI/CPI escalation parameters are missing from the contract extraction.',
        severity: 'Medium', confidence: 'High'
      })
    }
  } catch (err: any) {
    checks.push({
      check_id: 'CHECK_2_ESCALATION',
      check_name: 'Escalation',
      verdict: 'ERROR',
      expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
      clause_reference: params.escalation?.clause_reference || 'N/A',
      source_clause: 'Check failed: ' + err.message,
      page_number: 0, explanation: 'Error in calculation engine.',
      severity: 'High', confidence: 'Low'
    })
  }

  // CHECK 3 — Variable Component
  try {
    if (params.variable_component?.value) {
      if (generation) {
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
      } else {
        checks.push({
          check_id: 'CHECK_3_VARIABLE',
          check_name: 'Variable Component',
          verdict: 'INSUFFICIENT_DATA',
          expected_amount: 0,
          actual_amount: 0,
          gap_amount: 0,
          opportunity_amount: 0,
          clause_reference: params.variable_component.clause_reference,
          source_clause: params.variable_component.source_clause,
          page_number: params.variable_component.page_number,
          explanation: 'Upload generation data to run this check',
          severity: 'Low',
          confidence: 'High'
        })
      }
    } else {
      checks.push({
        check_id: 'CHECK_3_VARIABLE',
        check_name: 'Variable Component',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
        clause_reference: params.variable_component?.clause_reference || 'N/A',
        source_clause: 'Variable rates not found',
        page_number: params.variable_component?.page_number || 0,
        explanation: 'Variable component rates are missing from the contract extraction.',
        severity: 'Low', confidence: 'High'
      })
    }
  } catch (err: any) {
    checks.push({
      check_id: 'CHECK_3_VARIABLE',
      check_name: 'Variable Component',
      verdict: 'ERROR',
      expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
      clause_reference: params.variable_component?.clause_reference || 'N/A',
      source_clause: 'Check failed: ' + err.message,
      page_number: 0, explanation: 'Error in calculation engine.',
      severity: 'High', confidence: 'Low'
    })
  }

  // CHECK 4 — Liquidated Damages (LD)
  try {
    if (params.availability_guarantee_pct?.value != null && params.ld_rate_per_pp?.value != null) {
      if (generation) {
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
      } else {
        checks.push({
          check_id: 'CHECK_4_LD',
          check_name: 'Liquidated Damages',
          verdict: 'INSUFFICIENT_DATA',
          expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
          clause_reference: params.ld_rate_per_pp.clause_reference,
          source_clause: params.ld_rate_per_pp.source_clause,
          page_number: params.ld_rate_per_pp.page_number,
          explanation: 'Upload ops data to run this check',
          severity: 'Low', confidence: 'High'
        })
      }
    } else {
      checks.push({
        check_id: 'CHECK_4_LD',
        check_name: 'Liquidated Damages',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
        clause_reference: params.ld_rate_per_pp?.clause_reference || 'N/A',
        source_clause: 'LD terms not found',
        page_number: params.ld_rate_per_pp?.page_number || 0,
        explanation: 'Availability guarantee or LD rates are missing from the contract extraction.',
        severity: 'Medium', confidence: 'High'
      })
    }
  } catch (err: any) {
    checks.push({
      check_id: 'CHECK_4_LD',
      check_name: 'Liquidated Damages',
      verdict: 'ERROR',
      expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
      clause_reference: params.ld_rate_per_pp?.clause_reference || 'N/A',
      source_clause: 'Check failed: ' + err.message,
      page_number: 0, explanation: 'Error in calculation engine.',
      severity: 'High', confidence: 'Low'
    })
  }

  // CHECK 5 — Performance Bonus
  try {
    if (params.bonus_threshold_pct?.value != null && params.bonus_rate_per_pp?.value != null) {
      if (generation) {
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
      } else {
        checks.push({
          check_id: 'CHECK_5_BONUS',
          check_name: 'Performance Bonus',
          verdict: 'INSUFFICIENT_DATA',
          expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
          clause_reference: params.bonus_threshold_pct.clause_reference,
          source_clause: params.bonus_threshold_pct.source_clause,
          page_number: params.bonus_threshold_pct.page_number,
          explanation: 'Upload ops data to run this check',
          severity: 'Low', confidence: 'High'
        })
      }
    } else {
      checks.push({
        check_id: 'CHECK_5_BONUS',
        check_name: 'Performance Bonus',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
        clause_reference: params.bonus_threshold_pct?.clause_reference || 'N/A',
        source_clause: 'Bonus terms not found',
        page_number: params.bonus_threshold_pct?.page_number || 0,
        explanation: 'Performance bonus thresholds or rates are missing from the contract extraction.',
        severity: 'Low', confidence: 'High'
      })
    }
  } catch (err: any) {
    checks.push({
      check_id: 'CHECK_5_BONUS',
      check_name: 'Performance Bonus',
      verdict: 'ERROR',
      expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
      clause_reference: params.bonus_threshold_pct?.clause_reference || 'N/A',
      source_clause: 'Check failed: ' + err.message,
      page_number: 0, explanation: 'Error in calculation engine.',
      severity: 'High', confidence: 'Low'
    })
  }

  // CHECK 6 — GST Correctness
  try {
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
  } catch (err: any) {
    checks.push({
      check_id: 'CHECK_6_GST',
      check_name: 'GST Correctness',
      verdict: 'ERROR',
      expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
      clause_reference: 'GST Act',
      source_clause: 'Check failed: ' + err.message,
      page_number: 0, explanation: 'Error in calculation engine.',
      severity: 'Medium', confidence: 'Low'
    })
  }

  // CHECK 7 — Payment Terms Breach
  try {
    if (params.payment_terms_days?.value != null && params.late_payment_interest?.value) {
      if (invoice.status === 'Pending' || invoice.status === 'Overdue') {
        const invoiceDate = new Date(invoice.invoice_date)
        const today = new Date()
        const daysSinceInvoice = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceInvoice > params.payment_terms_days.value) {
          // Attempt to parse interest rate (e.g. "SBI base + 2%" or "15%")
          const interestStr = params.late_payment_interest.value.toString()
          const match = interestStr.match(/(\d+(?:\.\d+)?)/)
          const parsedRate = match ? parseFloat(match[1]) : 15 // Fallback to 15% if unparseable
          
          const overdueDays = daysSinceInvoice - params.payment_terms_days.value
          const outstanding = invoice.total
          const interest = Math.round(outstanding * (parsedRate / 100) * (overdueDays / 365))
          
          checks.push({
            check_id: 'CHECK_7_PAYMENT_TERMS',
            check_name: 'Payment Terms Breach',
            verdict: 'GAP',
            expected_amount: 0,
            actual_amount: 0,
            gap_amount: interest,
            opportunity_amount: null,
            clause_reference: params.payment_terms_days.clause_reference,
            source_clause: `Payment due in ${params.payment_terms_days.value} days. Interest: ${params.late_payment_interest.value}`,
            page_number: params.payment_terms_days.page_number,
            explanation: getFormulaProof(
              'Late Payment Interest',
              `${formatINR(outstanding)} × ${parsedRate}% × (${overdueDays} days / 365)`,
              formatINR(interest)
            ),
            severity: 'High',
            confidence: match ? 'High' : 'Medium'
          })
        } else {
          checks.push({
            check_id: 'CHECK_7_PAYMENT_TERMS',
            check_name: 'Payment Terms',
            verdict: 'MATCH',
            expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: null,
            clause_reference: params.payment_terms_days.clause_reference,
            source_clause: `Payment due in ${params.payment_terms_days.value} days.`,
            page_number: params.payment_terms_days.page_number,
            explanation: `Invoice is within the ${params.payment_terms_days.value} day payment window (${daysSinceInvoice} days elapsed).`,
            severity: null, confidence: 'High'
          })
        }
      }
    } else {
      checks.push({
        check_id: 'CHECK_7_PAYMENT_TERMS',
        check_name: 'Payment Terms Breach',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
        clause_reference: params.payment_terms_days?.clause_reference || 'N/A',
        source_clause: 'Payment terms not found in contract',
        page_number: params.payment_terms_days?.page_number || 0,
        explanation: 'Payment terms or interest rate missing from contract parameters.',
        severity: 'Low', confidence: 'High'
      })
    }
  } catch (err: any) {
    checks.push({
      check_id: 'CHECK_7_PAYMENT_TERMS',
      check_name: 'Payment Terms Breach',
      verdict: 'ERROR',
      expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
      clause_reference: 'N/A',
      source_clause: 'Check failed: ' + err.message,
      page_number: 0, explanation: 'Error in calculation engine.',
      severity: 'High', confidence: 'Low'
    })
  }

  // CHECK 8 — Escalation Cap/Floor applied
  try {
    if (params.escalation?.value && params.base_monthly_fee?.value != null) {
      const esc = params.escalation.value
      const indexType = esc.type
      if (indexType === 'WPI' || indexType === 'CPI') {
        const invoiceYear = new Date(invoice.invoice_date).getFullYear()
        const baseMonth = esc.index_base_month || 'January'
        const monthMap: Record<string, string> = { 'January': '01', 'April': '04' }
        const mm = monthMap[baseMonth] || '01'
        
        const currentKey = `${invoiceYear}-${mm}`
        const baseKey = `${invoiceYear - 1}-${mm}`
        const currentIndex = lookupIndex(indexType, currentKey)
        const baseIndex = lookupIndex(indexType, baseKey)

        if (currentIndex && baseIndex) {
          const rawFactor = currentIndex / baseIndex
          const capFactor = 1 + (esc.cap_pct / 100)
          const floorFactor = 1 + (esc.floor_pct / 100)
          
          if (rawFactor > capFactor) {
            checks.push({
              check_id: 'CHECK_8_CAP_FLOOR',
              check_name: 'Escalation Cap Applied',
              verdict: 'MATCH',
              expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: null,
              clause_reference: params.escalation.clause_reference,
              source_clause: `Cap at ${esc.cap_pct}%`,
              page_number: params.escalation.page_number,
              explanation: `Raw escalation was ${((rawFactor - 1)*100).toFixed(2)}%, which exceeded the cap of ${esc.cap_pct}%. Cap was successfully applied to limit vendor payout.`,
              severity: null, confidence: 'High'
            })
          } else if (rawFactor < floorFactor) {
            checks.push({
              check_id: 'CHECK_8_CAP_FLOOR',
              check_name: 'Escalation Floor Applied',
              verdict: 'GAP', // Floor means we must pay more than the raw index suggests, which is a financial gap from a purely index perspective, or just flag it
              expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: null,
              clause_reference: params.escalation.clause_reference,
              source_clause: `Floor at ${esc.floor_pct}%`,
              page_number: params.escalation.page_number,
              explanation: `Raw escalation was ${((rawFactor - 1)*100).toFixed(2)}%, which was below the floor of ${esc.floor_pct}%. Floor was applied.`,
              severity: 'Low', confidence: 'High'
            })
          } else {
             checks.push({
              check_id: 'CHECK_8_CAP_FLOOR',
              check_name: 'Escalation Guardrails',
              verdict: 'MATCH',
              expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: null,
              clause_reference: params.escalation.clause_reference,
              source_clause: `Cap ${esc.cap_pct}% | Floor ${esc.floor_pct}%`,
              page_number: params.escalation.page_number,
              explanation: `Raw escalation was ${((rawFactor - 1)*100).toFixed(2)}%, which is within the contractual cap and floor limits. No override required.`,
              severity: null, confidence: 'High'
            })
          }
        } else {
          checks.push({
            check_id: 'CHECK_8_CAP_FLOOR',
            check_name: 'Escalation Guardrails',
            verdict: 'INSUFFICIENT_DATA',
            expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
            clause_reference: params.escalation.clause_reference,
            source_clause: 'WPI Index data missing',
            page_number: params.escalation.page_number,
            explanation: 'Index data for the period not available in the local cache.',
            severity: 'Low', confidence: 'High'
          })
        }
      } else {
        checks.push({
          check_id: 'CHECK_8_CAP_FLOOR',
          check_name: 'Escalation Guardrails',
          verdict: 'MATCH',
          expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: null,
          clause_reference: params.escalation.clause_reference,
          source_clause: 'Fixed Escalation / None',
          page_number: params.escalation.page_number,
          explanation: 'No index-based escalation cap/floor applicable for this contract type.',
          severity: null, confidence: 'High'
        })
      }
    } else {
      checks.push({
        check_id: 'CHECK_8_CAP_FLOOR',
        check_name: 'Escalation Guardrails',
        verdict: 'INSUFFICIENT_DATA',
        expected_amount: 0, actual_amount: 0, gap_amount: 0, opportunity_amount: 0,
        clause_reference: params.escalation?.clause_reference || 'N/A',
        source_clause: 'Escalation terms not found',
        page_number: params.escalation?.page_number || 0,
        explanation: 'Escalation clause or base fee missing from contract parameters.',
        severity: 'Low', confidence: 'High'
      })
    }
  } catch (err: any) {
    // Check 8 fail silently, non-critical
  }

  return checks
}
