import { Badge } from '@/components/ui/badge'
import type { ValidationCheck } from '@/lib/schemas/validation'

interface GapBadgeProps {
  verdict: ValidationCheck['verdict']
}

const VERDICT_LABELS: Record<ValidationCheck['verdict'], string> = {
  MATCH: 'MATCH',
  GAP: 'GAP',
  OPPORTUNITY: 'OPP',
  INSUFFICIENT_DATA: 'N/A',
  ERROR: 'ERR',
}

const VERDICT_VARIANTS: Record<ValidationCheck['verdict'], 'match' | 'gap' | 'opportunity' | 'insufficient'> = {
  MATCH: 'match',
  GAP: 'gap',
  OPPORTUNITY: 'opportunity',
  INSUFFICIENT_DATA: 'insufficient',
  ERROR: 'gap',
}

export function GapBadge({ verdict }: GapBadgeProps) {
  return (
    <Badge variant={VERDICT_VARIANTS[verdict]}>
      {VERDICT_LABELS[verdict]}
    </Badge>
  )
}
