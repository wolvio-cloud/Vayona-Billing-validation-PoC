/**
 * Static fallback indices (OEA GoI for WPI, MOSPI for CPI).
 * In a real app, these would be fetched from an API or DB.
 */
export const INDICES_STATIC: Record<string, Record<string, number>> = {
  WPI: {
    '2020-01': 121.1,
    '2021-01': 127.3,
    '2022-01': 143.6,
    '2023-01': 154.2,
    '2024-01': 158.8,
    '2025-01': 163.4,
  },
  CPI: {
    '2020-01': 148.6,
    '2021-01': 156.2,
    '2022-01': 165.5,
    '2023-01': 176.3,
    '2024-01': 185.2,
    '2025-01': 194.8,
  }
}

export function lookupIndex(type: 'WPI' | 'CPI', yearMonth: string): number | null {
  return INDICES_STATIC[type]?.[yearMonth] ?? null
}

export function escalationFactor(
  current: number,
  base: number,
  capPct: number,
  floorPct: number = 0
): number {
  const rawChange = (current - base) / base
  const cappedChange = Math.max(floorPct / 100, Math.min(rawChange, capPct / 100))
  // Precision adjustment for Indian LTSA standards (Floor to 5 decimal places)
  const preciseChange = Math.floor(cappedChange * 100000) / 100000
  return 1 + preciseChange
}
