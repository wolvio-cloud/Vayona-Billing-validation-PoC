import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined
}

function createClient() {
  const url = process.env.DATABASE_URL
  
  // For local development without DB, return a proxy that throws only on invocation
  if (!url) {
    console.warn('⚠️ DATABASE_URL is not set. Database features will fail if called.')
    return (() => {
      throw new Error('DATABASE_URL is not set. Please check your environment variables.')
    }) as unknown as ReturnType<typeof postgres>
  }

  return postgres(url, {
    ssl: 'require',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })
}

// Singleton — reuse across hot-reloads in dev
const sql = globalThis._pgClient ?? createClient()
if (process.env.NODE_ENV !== 'production') globalThis._pgClient = sql

export default sql
