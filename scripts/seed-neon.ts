import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'

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
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

const sql = neon(url)

async function seed() {
  console.log('🌱 Starting Data Hydration Engine...')

  // 1. Check if contracts table is already seeded
  const existingContracts = await sql`SELECT count(*) FROM contracts`
  if (parseInt((existingContracts[0] as any).count) > 0) {
    console.log('ℹ️ Contracts table already contains data. Skipping seeding.')
    return
  }

  // 2. Load Portfolio to get display names
  const portfolioPath = join(process.cwd(), 'demo_data', 'portfolio.json')
  const portfolio = JSON.parse(readFileSync(portfolioPath, 'utf-8'))
  const nameMap = new Record<string, string>()
  portfolio.forEach((c: any) => { nameMap[c.contract_id] = c.display_name })

  // 3. Seed Contracts
  const contractsDir = join(process.cwd(), 'demo_data', 'contracts')
  const contractFiles = readdirSync(contractsDir).filter(f => f.endsWith('.json'))
  
  const idMapping = new Map<string, string>() // internal uuid mapping

  for (const file of contractFiles) {
    const contractId = file.replace('.json', '')
    const data = JSON.parse(readFileSync(join(contractsDir, file), 'utf-8'))
    
    console.log(`  📄 Seeding Contract: ${contractId}`)
    const result = await sql`
      INSERT INTO contracts (contract_id, display_name, parameters, extraction_status)
      VALUES (${contractId}, ${nameMap[contractId] || contractId}, ${JSON.stringify(data)}, 'completed')
      RETURNING id
    `
    idMapping.set(contractId, (result[0] as any).id)
  }

  // 4. Seed Invoices
  const invoicesDir = join(process.cwd(), 'demo_data', 'invoices')
  if (existsSync(invoicesDir)) {
    const invoiceFiles = readdirSync(invoicesDir).filter(f => f.endsWith('.json'))
    for (const file of invoiceFiles) {
      // Filename could be "INV-001.json" (C001) or "C002-INV-001.json"
      let contractId = 'C001'
      let invoiceId = file.replace('.json', '')
      
      if (invoiceId.includes('-INV-')) {
        const parts = invoiceId.split('-INV-')
        contractId = parts[0]
        invoiceId = 'INV-' + parts[1]
      }

      const data = JSON.parse(readFileSync(join(invoicesDir, file), 'utf-8'))
      const internalContractId = idMapping.get(contractId)
      
      if (internalContractId) {
        console.log(`    🧾 Seeding Invoice: ${invoiceId} for ${contractId}`)
        await sql`
          INSERT INTO invoices (invoice_id, contract_id, invoice_date, period_start, period_end, line_items, total, status)
          VALUES (
            ${data.invoice_id || invoiceId}, 
            ${internalContractId}, 
            ${data.invoice_date || '2024-01-01'}, 
            ${data.period_start}, 
            ${data.period_end}, 
            ${JSON.stringify(data.line_items || [])}, 
            ${data.total || 0},
            'Paid'
          )
        `
      }
    }
  }

  // 5. Seed Generation Data
  const genDataPath = join(process.cwd(), 'demo_data', 'generation', 'gen-data.json')
  if (existsSync(genDataPath)) {
    const genData = JSON.parse(readFileSync(genDataPath, 'utf-8'))
    const internalContractId = idMapping.get(genData.contract_id)
    if (internalContractId) {
      console.log(`    📊 Seeding Generation Data for ${genData.contract_id}`)
      for (const entry of genData.monthly) {
        await sql`
          INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
          VALUES (
            ${internalContractId},
            ${entry.month + '-01'},
            ${entry.month + '-28'},
            ${entry.kwh},
            ${entry.availability_pct}
          )
        `
      }
    }
  }

  console.log(`\n✅ Seeding complete: ${idMapping.size} contracts migrated to Neon.`)
}

// Simple Record helper
class Record<K extends string | number | symbol, V> {
  [key: string]: V
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
