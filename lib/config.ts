import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DEMO_MODE: z.string().optional().transform((v) => v !== 'false'),
  UPLOAD_DIR: z.string().default('./uploads'),
})

function loadConfig() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Missing or invalid environment variables:\n${missing.join('\n')}`)
  }
  return parsed.data
}

let _config: z.infer<typeof envSchema> | null = null

export function getConfig() {
  if (!_config) _config = loadConfig()
  return _config
}

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  demoMode: process.env.DEMO_MODE !== 'false',
}
