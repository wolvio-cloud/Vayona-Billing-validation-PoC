import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'

// Load .env.local before anything else
const envPath = join(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const val = trimmed.slice(eqIndex + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('❌ DATABASE_URL is not set — ensure .env.local exists with DATABASE_URL')
  process.exit(1)
}

const sql = neon(url)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  pdf_storage_path TEXT,
  raw_text TEXT,
  page_count INT,
  parameters JSONB,
  extraction_status TEXT DEFAULT 'pending',
  extraction_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT UNIQUE NOT NULL,
  contract_id UUID REFERENCES contracts(id),
  invoice_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  line_items JSONB,
  subtotal NUMERIC,
  gst_rate NUMERIC DEFAULT 18,
  gst_amount NUMERIC,
  total NUMERIC,
  status TEXT DEFAULT 'Pending',
  source TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS generation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  period_start DATE,
  period_end DATE,
  total_kwh NUMERIC,
  availability_pct NUMERIC,
  source TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  invoice_id UUID REFERENCES invoices(id),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  checks JSONB,
  total_gap_amount NUMERIC,
  total_opportunity_amount NUMERIC,
  verdict TEXT,
  status TEXT DEFAULT 'PENDING',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  fc_notes TEXT
);
`

async function migrate() {
  console.log('🚀 Running Neon Schema Enforcement...')
  try {
    // Neon neon() doesn't support multiple statements in one call easily like unsafe() in postgres.js
    // So we split by semicolon and filter empty lines
    const statements = SCHEMA.split(';').filter(s => s.trim())
    for (const statement of statements) {
      await (sql as any).query(statement)
      console.log(`  ✓ executed statement`)
    }
    console.log('\n✅ All migrations complete.')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

migrate()
