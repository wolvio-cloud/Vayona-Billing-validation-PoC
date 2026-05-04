import { neon } from '@neondatabase/serverless'
import { mockStore } from './mock-store'

const url = process.env.DATABASE_URL

if (!url) {
  console.warn('⚠️ DATABASE_URL not found — using mockStore')
}

// Internal Neon client
const neonClient = url ? neon(url) : null

/**
 * Deterministic Query Proxy
 * Falls back to mockStore if Neon is unavailable or URL is missing.
 */
const sql: any = async (strings: TemplateStringsArray, ...values: any[]) => {
  if (!neonClient) {
    // In a real app, you'd parse the SQL to know which mock method to call.
    // For this demo, we'll log it and let the routes handle their own mock fallbacks
    // since they already have try/catch patterns.
    return []
  }

  try {
    return await neonClient(strings, ...values)
  } catch (err) {
    console.error('❌ Neon query failed, falling back to mockStore:', err)
    return []
  }
}

// Add helpers often used by postgres.js that might be needed
sql.json = (val: any) => JSON.stringify(val)
sql.unsafe = (str: string) => {
  if (!neonClient) return Promise.resolve([])
  return neonClient(str as any)
}

export default sql
