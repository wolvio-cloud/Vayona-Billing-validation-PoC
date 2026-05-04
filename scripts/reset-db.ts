import { neon } from '@neondatabase/serverless'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

// Load .env.local
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
  process.exit(1)
}

const sql = neon(url)

async function reset() {
  console.log('🗑️ Truncating tables...')
  await sql.query('TRUNCATE TABLE validation_runs CASCADE')
  await sql.query('TRUNCATE TABLE generation_data CASCADE')
  await sql.query('TRUNCATE TABLE invoices CASCADE')
  await sql.query('TRUNCATE TABLE contracts CASCADE')
  console.log('✅ Tables truncated.')
}

reset().then(() => {
  // Now run the seed logic
  require('./seed-neon')
})
