#!/usr/bin/env node
/**
 * Generates mathematically consistent demo invoices for ALL contracts.
 */

const fs = require('fs')
const path = require('path')

const INV_DIR = path.join(__dirname, '..', 'demo_data', 'invoices')
if (!fs.existsSync(INV_DIR)) fs.mkdirSync(INV_DIR, { recursive: true })

// Match indices.ts
const WPI = { '2023-01': 154.2, '2024-01': 158.8, '2025-01': 163.4 }
const CPI = { '2023-01': 176.3, '2024-01': 185.2, '2025-01': 194.8 }

function getEscalation(type, baseFee, year, capPct) {
  const table = type === 'WPI' ? WPI : CPI
  const curr = table[`${year}-01`]
  const prev = table[`${year - 1}-01`]
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

// C001 LTSA
;(() => {
  const BASE = 12000000
  const ESCALATED = getEscalation('WPI', BASE, 2025, 8)
  const RATE_KWH = 0.04
  write('INV-001', {
    invoice_id: 'INV-001', contract_id: 'C001',
    invoice_date: '2024-01-31', period_start: '2024-01-01', period_end: '2024-01-31',
    line_items: [{ item_id: 'LI-1', description: 'Base Fee', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE }],
    subtotal: BASE, gst_rate: 18, gst_amount: gst(BASE), total: BASE + gst(BASE),
    status: 'Paid'
  })
  write('INV-002', {
    invoice_id: 'INV-002', contract_id: 'C001',
    invoice_date: '2025-04-30', period_start: '2025-04-01', period_end: '2025-04-30',
    line_items: [{ item_id: 'LI-1', description: 'Base Fee (Missing Escalation)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: BASE, amount: BASE }],
    subtotal: BASE, gst_rate: 18, gst_amount: gst(BASE), total: BASE + gst(BASE),
    status: 'Pending', note: `GAP: Missing WPI escalation. Correct: ${ESCALATED}`
  })
})()

// C002 Wind
;(() => {
  const BASE = 40000000
  const ESCALATED = getEscalation('WPI', BASE, 2025, 10)
  write('C002-INV-001', {
    invoice_id: 'C002-INV-001', contract_id: 'C002',
    invoice_date: '2025-05-31', period_start: '2025-05-01', period_end: '2025-05-31',
    line_items: [{ item_id: 'LI-1', description: 'Escalated Base Fee', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: ESCALATED, amount: ESCALATED }],
    subtotal: ESCALATED, gst_rate: 18, gst_amount: gst(ESCALATED), total: ESCALATED + gst(ESCALATED),
    status: 'Paid'
  })
})()

// C004 Solar CPI
;(() => {
  const BASE = 3000000
  const ESCALATED = getEscalation('CPI', BASE, 2025, 5)
  write('C004-INV-001', {
    invoice_id: 'C004-INV-001', contract_id: 'C004',
    invoice_date: '2025-01-31', period_start: '2025-01-01', period_end: '2025-01-31',
    line_items: [{ item_id: 'LI-1', description: 'Monthly Fee (Correct CPI)', category: 'BaseFee', quantity: 1, unit: 'Month', unit_rate: ESCALATED, amount: ESCALATED }],
    subtotal: ESCALATED, gst_rate: 18, gst_amount: gst(ESCALATED), total: ESCALATED + gst(ESCALATED),
    status: 'Paid'
  })
})()

console.log('✅ Invoices updated.')
