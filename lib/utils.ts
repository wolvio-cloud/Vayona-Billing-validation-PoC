import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatINRShort(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`
  return formatINR(amount)
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(2)}%`
}

export function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/**
 * Safely extract JSON from an LLM response.
 * Strips markdown code fences (```json ... ```) before parsing.
 * Returns null instead of throwing on parse failure.
 */
export function safeExtractJSON(raw: string): unknown | null {
  try {
    // Strip ```json ... ``` or ``` ... ``` wrappers
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    return JSON.parse(stripped)
  } catch {
    try {
      // Last resort: find first { or [ and last } or ]
      const start = raw.search(/[{[]/)
      const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'))
      if (start !== -1 && end > start) {
        return JSON.parse(raw.slice(start, end + 1))
      }
    } catch { /* no-op */ }
    return null
  }
}
