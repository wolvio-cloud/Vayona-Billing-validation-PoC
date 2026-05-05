import { createLogger } from '@/lib/logger'

const logger = createLogger('extraction-utils')

/**
 * Robustly extracts and parses JSON from a potentially messy string.
 * Handles markdown fences, leading/trailing text, and common encoding issues.
 */
export function safeParseJSON<T>(input: string): T {
  try {
    // 1. Try direct parse
    return JSON.parse(input) as T
  } catch {
    // 2. Look for JSON markdown block
    const match = input.match(/```json\s*([\s\S]*?)\s*```/)
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]) as T
      } catch (err) {
        logger.error('Failed to parse JSON within markdown fence', err)
      }
    }

    // 3. Last ditch: find first { and last }
    const start = input.indexOf('{')
    const end = input.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      const candidate = input.substring(start, end + 1)
      try {
        return JSON.parse(candidate) as T
      } catch (err) {
        logger.error('Failed to parse JSON after bounding {} discovery', err)
      }
    }

    throw new Error('No valid JSON structure found in input string.')
  }
}

/**
 * Replaces placeholders or "N/A" with nulls for clean database storage.
 */
export function sanitizeExtractedData(data: any): any {
  if (data === null || data === undefined) return null
  if (typeof data === 'string') {
    const val = data.trim().toUpperCase()
    if (val === 'N/A' || val === 'NONE' || val === 'NOT FOUND') return null
    return data.trim()
  }
  if (Array.isArray(data)) return data.map(sanitizeExtractedData)
  if (typeof data === 'object') {
    // If this object is a TracedField and its value is missing
    if (
      'value' in data && 
      (data.value === null || data.flag === 'NOT_FOUND' || data.source_clause === 'NOT FOUND')
    ) {
      return {
        value: null,
        flag: 'NOT_FOUND',
        confidence: 'low',
        source_clause: 'Not found in document',
        clause_reference: data.clause_reference && data.clause_reference !== 'N/A' ? data.clause_reference : 'N/A',
        page_number: data.page_number || 0
      }
    }

    const obj: any = {}
    for (const [k, v] of Object.entries(data)) {
      obj[k] = sanitizeExtractedData(v)
    }
    return obj
  }
  return data
}
