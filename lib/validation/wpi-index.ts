// Static fallback WPI table (OEA GoI). Supabase is the source of truth at runtime.
export const WPI_STATIC: Record<string, number> = {
  '2020-01': 121.1,
  '2021-01': 127.3,
  '2022-01': 143.6,
  '2023-01': 154.2,
  '2024-01': 158.8,
  '2025-01': 163.4,
}

export function lookupWPI(yearMonth: string): number | null {
  return WPI_STATIC[yearMonth] ?? null
}

export function wpiEscalationFactor(
  currentJanWPI: number,
  baseJanWPI: number,
  capPct: number
): number {
  const raw = currentJanWPI / baseJanWPI
  const capped = Math.min(raw, 1 + capPct / 100)
  return capped
}
