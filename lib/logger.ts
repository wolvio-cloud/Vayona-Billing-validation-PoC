type Level = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: Level
  span: string
  message: string
  data?: unknown
  durationMs?: number
}

function log({ level, span, message, data, durationMs }: LogEntry) {
  const ts = new Date().toISOString()
  const dur = durationMs !== undefined ? ` [${durationMs}ms]` : ''
  const prefix = `[${ts}] [${level.toUpperCase()}] [${span}]${dur}`
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  if (data !== undefined) {
    fn(prefix, message, data)
  } else {
    fn(prefix, message)
  }
}

export function createLogger(span: string) {
  return {
    info: (message: string, data?: unknown) => log({ level: 'info', span, message, data }),
    warn: (message: string, data?: unknown) => log({ level: 'warn', span, message, data }),
    error: (message: string, data?: unknown) => log({ level: 'error', span, message, data }),
    debug: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        log({ level: 'debug', span, message, data })
      }
    },
    timed: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
      const start = Date.now()
      try {
        const result = await fn()
        log({ level: 'info', span, message: label, durationMs: Date.now() - start })
        return result
      } catch (err) {
        log({ level: 'error', span, message: `${label} failed`, data: err, durationMs: Date.now() - start })
        throw err
      }
    },
  }
}
