#!/usr/bin/env node
/**
 * Vayona Billing Validation — Demo Preflight Check
 * 
 * Run this before every client demo:
 *   node scripts/preflight.js
 * 
 * Checks:
 *  ✓ Node version
 *  ✓ Required env vars (graceful if missing, DB optional)
 *  ✓ All demo contract files exist with required fields
 *  ✓ All demo invoice files exist
 *  ✓ Generation data exists
 *  ✓ WPI index snapshot present
 *  ✓ Portfolio index valid
 *  ✓ Test suite passes
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const BOLD = '\x1b[1m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const AMBER = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

let passed = 0
let failed = 0
let warnings = 0

function ok(msg) { console.log(`  ${GREEN}✓${RESET} ${msg}`); passed++ }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`); failed++ }
function warn(msg) { console.log(`  ${AMBER}⚠${RESET} ${msg}`); warnings++ }
function section(title) { console.log(`\n${BOLD}${BLUE}── ${title} ──────────────────────────${RESET}`) }

async function run() {
  console.log(`\n${BOLD}╔══════════════════════════════════════════╗`)
  console.log(`║  Vayona Billing Validation — Preflight   ║`)
  console.log(`╚══════════════════════════════════════════╝${RESET}`)

  // 1. Node version
  section('Runtime')
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0])
  if (nodeVersion >= 18) ok(`Node ${process.version}`)
  else fail(`Node ${process.version} — need v18+`)

  // 2. Environment
  section('Environment Variables')
  if (process.env.ANTHROPIC_API_KEY) ok('ANTHROPIC_API_KEY set')
  else warn('ANTHROPIC_API_KEY not set — live extraction will fail. Demo cached mode still works.')
  
  if (process.env.DATABASE_URL) ok('DATABASE_URL set')
  else warn('DATABASE_URL not set — using mock store (demo safe)')

  // 3. Portfolio
  section('Portfolio Index')
  const portfolioPath = path.join(ROOT, 'demo_data', 'portfolio.json')
  if (fs.existsSync(portfolioPath)) {
    const portfolio = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'))
    if (Array.isArray(portfolio) && portfolio.length >= 8) ok(`Portfolio: ${portfolio.length} contracts indexed`)
    else fail(`Portfolio: only ${portfolio?.length ?? 0} contracts (need ≥ 8)`)
  } else fail('portfolio.json not found')

  // 4. Contract files
  section('Contract Data Files')
  const requiredContracts = ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008']
  const requiredFields = ['base_annual_fee', 'base_monthly_fee', 'escalation', 'availability_guarantee_pct']
  for (const id of requiredContracts) {
    const p = path.join(ROOT, 'demo_data', 'contracts', `${id}.json`)
    if (!fs.existsSync(p)) { fail(`${id}.json missing`); continue }
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const missing = requiredFields.filter(f => !(f in data))
    if (missing.length > 0) fail(`${id}.json missing fields: ${missing.join(', ')}`)
    else ok(`${id} ✓ (${data.display_name || data.contract_id})`)
  }

  // 5. Invoice files
  section('Invoice Data Files')
  const requiredInvoices = [
    ['C001', ['INV-001', 'INV-002', 'INV-003', 'INV-004', 'INV-005', 'INV-006']],
    ['C002', ['INV-001', 'INV-002', 'INV-003']],
  ]
  for (const [contractId, invoices] of requiredInvoices) {
    // Try flat structure first (C001 invoices), then nested
    for (const invId of invoices) {
      const flat = path.join(ROOT, 'demo_data', 'invoices', `${invId}.json`)
      const nested = path.join(ROOT, 'demo_data', 'invoices', contractId, `${invId}.json`)
      if (fs.existsSync(flat)) ok(`${contractId}/${invId}`)
      else if (fs.existsSync(nested)) ok(`${contractId}/${invId}`)
      else fail(`Missing: ${contractId}/${invId}`)
    }
  }

  // 6. Generation data
  section('Generation Data')
  const genPath = path.join(ROOT, 'demo_data', 'generation', 'gen-data.json')
  if (fs.existsSync(genPath)) ok('gen-data.json present')
  else warn('gen-data.json missing — variable component checks will use invoice data only')

  // 7. WPI index
  section('Data Provenance')
  const wpiPath = path.join(ROOT, 'demo_data', 'wpi-index.json')
  if (fs.existsSync(wpiPath)) {
    const wpi = JSON.parse(fs.readFileSync(wpiPath, 'utf-8'))
    const hasCurrentYear = wpi.data && Object.keys(wpi.data).some(k => k.startsWith('2025'))
    if (hasCurrentYear) ok(`WPI index: ${Object.keys(wpi.data).length} data points (source: ${wpi.source?.substring(0, 30)}...)`)
    else warn('WPI index present but may lack current year data')
  } else fail('wpi-index.json missing — escalation validation will use static fallback')

  // 8. Test suite
  section('Test Suite')
  try {
    const result = execSync('npx vitest run 2>&1', { cwd: ROOT, encoding: 'utf-8' })
    const testLine = result.match(/Tests\s+(\d+)\s+passed/)?.[0] || ''
    if (result.includes('passed')) ok(`Engine tests: ${testLine}`)
    else { fail('Test suite failed'); console.log(result.slice(-500)) }
  } catch (err) {
    fail('Test suite failed to run')
  }

  // 9. Summary
  console.log(`\n${BOLD}════════════════════════════════════════════${RESET}`)
  if (failed === 0 && warnings === 0) {
    console.log(`${GREEN}${BOLD}  ✓ DEMO READY — All ${passed} checks passed${RESET}`)
    console.log(`  ${GREEN}Start the dev server: npm run dev${RESET}`)
  } else if (failed === 0) {
    console.log(`${AMBER}${BOLD}  ⚠ DEMO READY WITH WARNINGS${RESET}`)
    console.log(`  ${GREEN}${passed} passed${RESET}, ${AMBER}${warnings} warnings${RESET}`)
    console.log(`  ${AMBER}Warnings: Live extraction may fail. Demo cached mode is safe.${RESET}`)
  } else {
    console.log(`${RED}${BOLD}  ✗ DEMO NOT READY${RESET}`)
    console.log(`  ${GREEN}${passed} passed${RESET}, ${RED}${failed} failed${RESET}, ${AMBER}${warnings} warnings${RESET}`)
    console.log(`  ${RED}Fix critical failures before the meeting.${RESET}`)
  }
  console.log(`${BOLD}════════════════════════════════════════════${RESET}\n`)

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => { console.error('Preflight script crashed:', err); process.exit(1) })
