import { ValidationLineItem } from './ValidationLineItem'
import { formatINRShort } from '@/lib/utils'
import type { ValidationResult } from '@/lib/schemas/validation'

interface ValidationReportProps {
  result: ValidationResult
}

export function ValidationReport({ result }: ValidationReportProps) {
  const gaps = result.checks.filter((c) => c.verdict === 'GAP')
  const opportunities = result.checks.filter((c) => c.verdict === 'OPPORTUNITY')
  const matches = result.checks.filter((c) => c.verdict === 'MATCH')

  return (
    <div className="grid grid-cols-[260px,1fr] gap-6">
      {/* Summary panel */}
      <div className="space-y-4">
        <div className="rounded-lg border border-[--color-border] bg-[--color-card] p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[--color-muted-foreground]">Summary</h3>
          {result.total_gap_amount > 0 && (
            <div>
              <div className="font-mono text-2xl font-bold text-[--color-wolvio-red]">
                {formatINRShort(result.total_gap_amount)}
              </div>
              <div className="text-xs text-[--color-muted-foreground]">total gap</div>
            </div>
          )}
          {result.total_opportunity_amount > 0 && (
            <div>
              <div className="font-mono text-xl font-bold text-[--color-wolvio-amber]">
                {formatINRShort(result.total_opportunity_amount)}
              </div>
              <div className="text-xs text-[--color-muted-foreground]">opportunity</div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-1 text-center text-xs pt-2 border-t border-[--color-border]">
            <div><div className="font-bold text-[--color-wolvio-green]">{matches.length}</div><div className="text-[--color-muted-foreground]">match</div></div>
            <div><div className="font-bold text-[--color-wolvio-red]">{gaps.length}</div><div className="text-[--color-muted-foreground]">gap</div></div>
            <div><div className="font-bold text-[--color-wolvio-amber]">{opportunities.length}</div><div className="text-[--color-muted-foreground]">opp</div></div>
          </div>
        </div>
      </div>

      {/* Findings panel */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[--color-muted-foreground]">Findings</h3>
        {result.checks.map((check) => (
          <ValidationLineItem key={check.check_id} check={check} />
        ))}
      </div>
    </div>
  )
}
