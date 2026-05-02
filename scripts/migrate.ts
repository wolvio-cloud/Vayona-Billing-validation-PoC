import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

// Load .env.local before anything else (tsx runs outside Next.js env loading)
const envPath = join(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
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
  console.error('DATABASE_URL is not set — ensure .env.local exists with DATABASE_URL')
  process.exit(1)
}

const sql = postgres(url, { ssl: 'require', max: 1 })

const files = [
  'supabase/migrations/0001_init.sql',
  'supabase/seed/wpi_index.sql',
  'supabase/seed/demo_contracts.sql',
]

async function migrate() {
  for (const file of files) {
    const path = join(process.cwd(), file)
    const content = readFileSync(path, 'utf-8')
    console.log(`Running ${file}...`)
    await sql.unsafe(content)
    console.log(`  ✓ done`)
  }
  await sql.end()
  console.log('\nAll migrations complete.')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
