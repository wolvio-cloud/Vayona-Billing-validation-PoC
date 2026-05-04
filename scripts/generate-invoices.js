#!/usr/bin/env node
/**
 * Generates mathematically consistent demo invoices for ALL contracts.
 * 
 * Each invoice is precisely derived from the contract parameters so the
 * validation engine finds the correct gaps. Run with:
 *   node scripts/generate-invoices.js
 */

const fs = require('fs')
const path = require('path')

const INV_DIR = path.join(__dirname, '..', 'demo_data', 'invoices')
if (!fs.existsSync(INV_DIR)) fs.mkdirSync(INV_DIR, { recursive: true })

// WPI values (Jan snapshot, OEA GoI)
const WPI = { '2023-01': 154.2, '2024-01': 158.8, '2025-01': 163.4 }

function wpiEscalation(baseFee, year, capPct) {
  const curr = WPI[`${year}-01`]
  const prev = WPI[`${year - 1}-01`]
  if (!curr || !prev) return baseFee
  const raw = (curr - prev) / prev
  const capped = Math.min(raw, capPct / 100)
  return Math.round(baseFee * (1 + capped))
}

function gst(subtotal, rate = 18) {
  return Math.round(subtotal * rate / 100)
}

function write(invoiceId, data) {
  const p = path.join(INV_DIR, `${invoiceId}.json`)
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
  console.log(`✓ ${invoiceId}.json`)
}

// ──────────────────────────────────────────────────────────────
// C001 — Wind Farm Alpha LTSA (base_monthly: 12,000,000)
// Pre-escalation year: invoices from 2024, escalation kicks in April 2025
// ──────────────────────────────────────────────────────────────
;(() => {
  const BASE = 12000000
  const ESC_CAP = 8
  const ESCALATED = wpiEscalation(BASE, 2025, ESC_CAP)         // ≈12,547,166
  const RATE_KWH = 0.04

  // INV-001: Clean invoice (Jan 2024, pre-escalation)
  const sub1 = BASE
  write('INV-001', {
    invoice_id: 'INV-001', contract_id: 'C001',
    invoice_date: '2024-01-31', period_start: '2024-01-01', period_end: '2024-01-31',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (Jan 2024)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE },
      { item_id: 'LI-002', description: 'WPI Escalation (not yet effective — April base)', category: 'Escalation', quantity: 1, unit: 'Month', unit_rate: 0, amount: 0 }
    ],
    subtotal: sub1, gst_rate: 18, gst_amount: gst(sub1), total: sub1 + gst(sub1),
    status: 'Paid', note: 'CLEAN — pre-escalation period, base fee correct'
  })

  // INV-002: WPI escalation NOT applied (gap scenario — the main demo invoice)
  // Correct amount = ESCALATED, invoice shows only BASE → gap = ESCALATED - BASE
  const sub2 = BASE  // wrong — should be ESCALATED
  write('INV-002', {
    invoice_id: 'INV-002', contract_id: 'C001',
    invoice_date: '2025-04-30', period_start: '2025-04-01', period_end: '2025-04-30',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (Apr 2025)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE },
      { item_id: 'LI-002', description: 'WPI Escalation (omitted by counterparty)', category: 'Escalation', quantity: 1, unit: 'Month', unit_rate: 0, amount: 0 },
      { item_id: 'LI-003', description: 'Variable Component (not billed — quarterly)', category: 'Variable', quantity: 0, unit: 'kWh', unit_rate: RATE_KWH, amount: 0 }
    ],
    subtotal: sub2, gst_rate: 18, gst_amount: gst(sub2), total: sub2 + gst(sub2),
    status: 'Paid',
    engineered_gap: 'WPI_ESCALATION_MISSING',
    expected_gap: ESCALATED - BASE,
    note: `GAP: WPI escalation for Apr 2025 not applied. Correct monthly fee = ₹${ESCALATED.toLocaleString('en-IN')}. Billed = ₹${BASE.toLocaleString('en-IN')}. Gap = ₹${(ESCALATED - BASE).toLocaleString('en-IN')}`
  })

  // INV-003: Q1 2025 variable component (Jan–Mar) — quarterly billing
  // Gen: 125M kWh (3 months). Correct variable = 125M * 0.04 = 5,000,000
  // Invoice under-bills at 4,000,000 (100M kWh basis — data gap)
  const escMonthlyQ1 = wpiEscalation(BASE, 2025, ESC_CAP)
  const subFixed = escMonthlyQ1 * 3  // 3 months
  const subVar = 4000000              // engineered shortfall (correct = 5,000,000)
  const sub3 = subFixed + subVar
  write('INV-003', {
    invoice_id: 'INV-003', contract_id: 'C001',
    invoice_date: '2025-04-15', period_start: '2025-01-01', period_end: '2025-03-31',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Fee Q1 2025 (3 months × escalated rate)', category: 'BaseFee', quantity: 3, unit: 'Month', unit_rate: escMonthlyQ1, amount: subFixed },
      { item_id: 'LI-002', description: 'Variable Component Q1 2025 (approx 100M kWh × ₹0.04)', category: 'Variable', quantity: 100000000, unit: 'kWh', unit_rate: RATE_KWH, amount: subVar }
    ],
    subtotal: sub3, gst_rate: 18, gst_amount: gst(sub3), total: sub3 + gst(sub3),
    status: 'Pending',
    engineered_gap: 'VARIABLE_COMPONENT_UNDER_BILLED',
    expected_gap: 1000000,
    note: 'GAP: Variable billed on 100M kWh; SCADA shows 125M kWh. Missing: 25M × ₹0.04 = ₹10L'
  })

  // INV-004: LD not netted (availability shortfall)
  // Availability: 93.5% vs guarantee 96.0% → shortfall 2.5 PP
  // LD = 2.5 × 0.5% × 144,000,000 = ₹18,00,000. Invoice doesn't net it.
  const ldOwed = Math.round(2.5 * 0.005 * 144000000)
  const sub4 = escMonthlyQ1  // paid full amount, no LD netting
  write('INV-004', {
    invoice_id: 'INV-004', contract_id: 'C001',
    invoice_date: '2025-05-31', period_start: '2025-05-01', period_end: '2025-05-31',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (May 2025)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: escMonthlyQ1, amount: escMonthlyQ1 },
      { item_id: 'LI-002', description: 'LD Deduction for April Availability Shortfall (not applied)', category: 'LD', quantity: 0, unit: 'PP', unit_rate: 0, amount: 0 }
    ],
    subtotal: sub4, gst_rate: 18, gst_amount: gst(sub4), total: sub4 + gst(sub4),
    status: 'Disputed',
    engineered_gap: 'LD_NOT_NETTED',
    expected_gap: ldOwed,
    note: `GAP: Availability Apr 2025 = 93.5% vs guarantee 96.0%. Shortfall 2.5 PP. LD = 2.5 × 0.5% × ₹14.4Cr = ₹${ldOwed.toLocaleString('en-IN')} should be deducted.`
  })

  // INV-005: Bonus opportunity (availability 99.2% vs threshold 98%)
  // Outperformance: 1.2 PP. Bonus = 1.2 × 1% × 144,000,000 = ₹17,28,000
  const bonusOwed = Math.round(1.2 * 0.01 * 144000000)
  const sub5 = escMonthlyQ1
  write('INV-005', {
    invoice_id: 'INV-005', contract_id: 'C001',
    invoice_date: '2025-06-30', period_start: '2025-06-01', period_end: '2025-06-30',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (Jun 2025)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: escMonthlyQ1, amount: escMonthlyQ1 },
      { item_id: 'LI-002', description: 'Performance Bonus (not claimed — 99.2% availability)', category: 'Bonus', quantity: 0, unit: 'PP', unit_rate: 0, amount: 0 }
    ],
    subtotal: sub5, gst_rate: 18, gst_amount: gst(sub5), total: sub5 + gst(sub5),
    status: 'Paid',
    engineered_gap: 'BONUS_NOT_CLAIMED',
    expected_gap: bonusOwed,
    note: `OPPORTUNITY: Availability Jun 2025 = 99.2% vs bonus threshold 98%. Outperformance 1.2 PP. Unclaimed bonus = 1.2 × 1% × ₹14.4Cr = ₹${bonusOwed.toLocaleString('en-IN')}`
  })

  // INV-006: Clean escalated invoice
  const sub6 = escMonthlyQ1
  write('INV-006', {
    invoice_id: 'INV-006', contract_id: 'C001',
    invoice_date: '2025-07-31', period_start: '2025-07-01', period_end: '2025-07-31',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (Jul 2025 — escalated)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: escMonthlyQ1, amount: escMonthlyQ1 }
    ],
    subtotal: sub6, gst_rate: 18, gst_amount: gst(sub6), total: sub6 + gst(sub6),
    status: 'Pending', note: 'CLEAN — escalated fee correctly applied'
  })

  console.log(`  C001 escalated monthly fee: ₹${ESCALATED.toLocaleString('en-IN')} (WPI ${WPI['2025-01']}/${WPI['2024-01']} cap ${ESC_CAP}%)`)
})()

// ──────────────────────────────────────────────────────────────
// C002 — ReNew Power Mega-LTSA (base_monthly: 40,000,000)
// ──────────────────────────────────────────────────────────────
;(() => {
  const BASE = 40000000
  const ESC_CAP = 10
  const ESCALATED = wpiEscalation(BASE, 2025, ESC_CAP)
  const RATE_KWH = 0.035
  const GEN_KWH = 120000000  // 120M kWh/month for 300MW wind

  // INV-001: Clean (Jan 2024)
  const sub1 = BASE + Math.round(GEN_KWH * RATE_KWH)
  write('C002-INV-001', {
    invoice_id: 'C002-INV-001', contract_id: 'C002',
    invoice_date: '2024-01-31', period_start: '2024-01-01', period_end: '2024-01-31',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (Jan 2024)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE },
      { item_id: 'LI-002', description: `Variable Component Jan 2024 (${GEN_KWH/1000000}M kWh × ₹0.035)`, category: 'Variable', quantity: GEN_KWH, unit: 'kWh', unit_rate: RATE_KWH, amount: Math.round(GEN_KWH * RATE_KWH) }
    ],
    subtotal: sub1, gst_rate: 18, gst_amount: gst(sub1), total: sub1 + gst(sub1),
    status: 'Paid', note: 'CLEAN — pre-escalation, all components correct'
  })

  // INV-002: WPI escalation not applied + LD not netted
  // Availability 96.8% vs guarantee 97.5% → shortfall 0.7 PP
  // LD = 0.7 × 2.5% × 480,000,000 = ₹84,00,000
  const ldOwed = Math.round(0.7 * 0.025 * 480000000)
  const sub2 = BASE + Math.round(GEN_KWH * RATE_KWH)  // no escalation, no LD
  write('C002-INV-002', {
    invoice_id: 'C002-INV-002', contract_id: 'C002',
    invoice_date: '2025-04-30', period_start: '2025-04-01', period_end: '2025-04-30',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (Apr 2025 — escalation missing)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE },
      { item_id: 'LI-002', description: `Variable Component Apr 2025 (${GEN_KWH/1000000}M kWh × ₹0.035)`, category: 'Variable', quantity: GEN_KWH, unit: 'kWh', unit_rate: RATE_KWH, amount: Math.round(GEN_KWH * RATE_KWH) },
      { item_id: 'LI-003', description: 'LD Deduction for availability shortfall (not applied)', category: 'LD', quantity: 0, unit: 'PP', unit_rate: 0, amount: 0 }
    ],
    subtotal: sub2, gst_rate: 18, gst_amount: gst(sub2), total: sub2 + gst(sub2),
    status: 'Pending',
    engineered_gap: 'WPI_MISSING_AND_LD_NOT_NETTED',
    expected_gap: (ESCALATED - BASE) + ldOwed,
    note: `GAP1: WPI escalation missing (gap ₹${(ESCALATED - BASE).toLocaleString('en-IN')}). GAP2: Availability 96.8% vs 97.5%, LD 0.7PP × 2.5% × ₹48Cr = ₹${ldOwed.toLocaleString('en-IN')}`
  })

  // INV-003: Clean escalated invoice
  const sub3 = ESCALATED + Math.round(GEN_KWH * RATE_KWH)
  write('C002-INV-003', {
    invoice_id: 'C002-INV-003', contract_id: 'C002',
    invoice_date: '2025-05-31', period_start: '2025-05-01', period_end: '2025-05-31',
    line_items: [
      { item_id: 'LI-001', description: 'Base O&M Monthly Fee (May 2025 — escalated)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: ESCALATED, amount: ESCALATED },
      { item_id: 'LI-002', description: `Variable Component May 2025 (${GEN_KWH/1000000}M kWh × ₹0.035)`, category: 'Variable', quantity: GEN_KWH, unit: 'kWh', unit_rate: RATE_KWH, amount: Math.round(GEN_KWH * RATE_KWH) }
    ],
    subtotal: sub3, gst_rate: 18, gst_amount: gst(sub3), total: sub3 + gst(sub3),
    status: 'Paid', note: 'CLEAN — escalation applied, variable correct'
  })

  console.log(`  C002 escalated monthly fee: ₹${ESCALATED.toLocaleString('en-IN')} | LD rate: 2.5%/PP | Gap on INV-002: ₹${((ESCALATED - BASE) + Math.round(0.7 * 0.025 * 480000000)).toLocaleString('en-IN')}`)
})()

// ──────────────────────────────────────────────────────────────
// C004 — Tata Solar Kurnool O&M (base_monthly: 3,000,000, CPI)
// ──────────────────────────────────────────────────────────────
;(() => {
  const BASE = 3000000
  const ESC_CAP = 5
  // CPI approximation — use WPI table as proxy for demo (labelled CPI)
  const ESCALATED = wpiEscalation(BASE, 2025, ESC_CAP)
  const RATE_KWH = 0.02
  const GEN_KWH = 7200000  // 50MW solar, ~144 kWh/kWp/month

  // INV-001: Clean
  const sub1 = ESCALATED + Math.round(GEN_KWH * RATE_KWH)
  write('C004-INV-001', {
    invoice_id: 'C004-INV-001', contract_id: 'C004',
    invoice_date: '2025-01-31', period_start: '2025-01-01', period_end: '2025-01-31',
    line_items: [
      { item_id: 'LI-001', description: 'Monthly O&M Fee (Jan 2025 — CPI escalated)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: ESCALATED, amount: ESCALATED },
      { item_id: 'LI-002', description: `Variable Component Jan 2025 (${GEN_KWH/1000}K kWh × ₹0.02)`, category: 'Variable', quantity: GEN_KWH, unit: 'kWh', unit_rate: RATE_KWH, amount: Math.round(GEN_KWH * RATE_KWH) }
    ],
    subtotal: sub1, gst_rate: 18, gst_amount: gst(sub1), total: sub1 + gst(sub1),
    status: 'Paid', note: 'CLEAN — CPI escalation applied, variable correct'
  })

  // INV-002: CPI escalation missing
  const sub2 = BASE + Math.round(GEN_KWH * RATE_KWH)
  write('C004-INV-002', {
    invoice_id: 'C004-INV-002', contract_id: 'C004',
    invoice_date: '2025-02-28', period_start: '2025-02-01', period_end: '2025-02-28',
    line_items: [
      { item_id: 'LI-001', description: 'Monthly O&M Fee (Feb 2025 — CPI escalation not applied)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE },
      { item_id: 'LI-002', description: `Variable Component Feb 2025`, category: 'Variable', quantity: GEN_KWH, unit: 'kWh', unit_rate: RATE_KWH, amount: Math.round(GEN_KWH * RATE_KWH) }
    ],
    subtotal: sub2, gst_rate: 18, gst_amount: gst(sub2), total: sub2 + gst(sub2),
    status: 'Pending',
    engineered_gap: 'CPI_ESCALATION_MISSING',
    expected_gap: ESCALATED - BASE,
    note: `GAP: CPI escalation for 2025 not applied. Correct monthly = ₹${ESCALATED.toLocaleString('en-IN')}. Gap = ₹${(ESCALATED - BASE).toLocaleString('en-IN')}`
  })
  console.log(`  C004 escalated monthly fee: ₹${ESCALATED.toLocaleString('en-IN')}`)
})()

// ──────────────────────────────────────────────────────────────
// C007 — Suzlon Fixed-Fee (base_monthly: 5,666,667, NO escalation)
// ──────────────────────────────────────────────────────────────
;(() => {
  const BASE = Math.round(68000000 / 12)  // ≈5,666,667

  // INV-001: Clean
  const sub1 = BASE
  write('C007-INV-001', {
    invoice_id: 'C007-INV-001', contract_id: 'C007',
    invoice_date: '2025-03-31', period_start: '2025-03-01', period_end: '2025-03-31',
    line_items: [
      { item_id: 'LI-001', description: 'Fixed-Fee Monthly Maintenance (Mar 2025)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE }
    ],
    subtotal: sub1, gst_rate: 18, gst_amount: gst(sub1), total: sub1 + gst(sub1),
    status: 'Paid', note: 'CLEAN — fixed fee, no escalation, no variable component'
  })

  // INV-002: Overbilled (wrong rate used)
  const WRONG_RATE = Math.round(BASE * 1.05)  // 5% more than contracted
  const sub2 = WRONG_RATE
  write('C007-INV-002', {
    invoice_id: 'C007-INV-002', contract_id: 'C007',
    invoice_date: '2025-04-30', period_start: '2025-04-01', period_end: '2025-04-30',
    line_items: [
      { item_id: 'LI-001', description: 'Fixed-Fee Monthly Maintenance (Apr 2025)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: WRONG_RATE, amount: WRONG_RATE }
    ],
    subtotal: sub2, gst_rate: 18, gst_amount: gst(sub2), total: sub2 + gst(sub2),
    status: 'Pending',
    engineered_gap: 'BASE_FEE_OVERBILLED',
    expected_gap: BASE - WRONG_RATE,  // negative = overbilled
    note: `GAP: Fixed fee contract. Invoiced ₹${WRONG_RATE.toLocaleString('en-IN')} but contract states ₹${BASE.toLocaleString('en-IN')}. Overbilled by ₹${(WRONG_RATE - BASE).toLocaleString('en-IN')}`
  })
  console.log(`  C007 fixed monthly fee: ₹${BASE.toLocaleString('en-IN')}`)
})()

console.log('\n✅ All invoice files generated.')
console.log('Note: C003/C005/C006/C008 share C001 invoice format for demo — run validate with ?invoice=C00X-INV-001')
