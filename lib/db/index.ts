import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined
}

function createNeonClient() {
  const url = process.env.DATABASE_URL
  
  if (!url) {
    console.warn('⚠️ Neon DATABASE_URL is not set. Falling back to mock-store for demo stability.')
    return null
  }

  return postgres(url, {
    ssl: 'require',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })
}

// Singleton — reuse across hot-reloads in dev
const _rawSql = globalThis._pgClient ?? createNeonClient()
if (process.env.NODE_ENV !== 'production' && _rawSql) globalThis._pgClient = _rawSql

// Define a safe query function that handles null/undefined sql client
const query: any = (template: any, ...args: any[]) => {
  if (!_rawSql) return Promise.resolve([])
  // Handle both tagged template and direct call
  if (Array.isArray(template)) {
    return (_rawSql as any)(template, ...args)
  }
  return (_rawSql as any)(template, ...args)
}

// Attach the 'json' and 'unsafe' helpers needed by some scripts/routes
query.json = (val: any) => (_rawSql ? (_rawSql as any).json(val) : JSON.stringify(val))
query.unsafe = (str: string) => (_rawSql ? (_rawSql as any).unsafe(str) : Promise.resolve([]))

export default query
