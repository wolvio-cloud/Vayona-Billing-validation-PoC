import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
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
