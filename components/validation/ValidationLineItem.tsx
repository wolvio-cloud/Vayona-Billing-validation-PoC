'use client'

import { useState } from 'react'
import { GapBadge } from './GapBadge'
import { formatINR } from '@/lib/utils'
import type { ValidationCheck } from '@/lib/schemas/validation'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ValidationLineItemProps {
  check: ValidationCheck
}

const VERDICT_BORDER: Record<ValidationCheck['verdict'], string> = {
  MATCH: 'border-[--color-wolvio-green]',
  GAP: 'border-[--color-wolvio-red]',
  OPPORTUNITY: 'border-[--color-wolvio-amber]',
  INSUFFICIENT_DATA: 'border-[--color-wolvio-slate]',
}

const VERDICT_ICON: Record<ValidationCheck['verdict'], string> = {
  MATCH: '✓',
  GAP: '✗',
  OPPORTUNITY: '◎',
  INSUFFICIENT_DATA: '?',
}

export function ValidationLineItem({ check }: ValidationLineItemProps) {
  const [expanded, setExpanded] = useState(check.verdict === 'GAP' || check.verdict === 'OPPORTUNITY')

  const gapValue = check.gap_amount ?? check.opportunity_amount
  const borderClass = VERDICT_BORDER[check.verdict]

  return (
    <div className={`border-l-4 ${borderClass} rounded-r-md bg-[--color-card] overflow-hidden`}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[--color-muted]/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <span className={check.verdict === 'GAP' ? 'text-[--color-wolvio-red]' : check.verdict === 'OPPORTUNITY' ? 'text-[--color-wolvio-amber]' : 'text-[--color-wolvio-green]'}>
            {VERDICT_ICON[check.verdict]}
          </span>
          <span className="font-medium text-sm">{check.check_name}</span>
          <GapBadge verdict={check.verdict} />
        </div>
        <div className="flex items-center gap-3">
          {gapValue != null && gapValue > 0 && (
            <span className={`font-mono text-sm font-bold ${check.verdict === 'GAP' ? 'text-[--color-wolvio-red]' : 'text-[--color-wolvio-amber]'}`}>
              {formatINR(gapValue)}
            </span>
          )}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[--color-border]">
          {check.expected_amount != null && (
            <div className="grid grid-cols-2 gap-2 pt-3 text-sm">
              <div>
                <span className="text-[--color-muted-foreground]">Expected</span>
                <div className="font-mono font-semibold">{formatINR(check.expected_amount)}</div>
              </div>
              {check.actual_amount != null && (
                <div>
                  <span className="text-[--color-muted-foreground]">Billed</span>
                  <div className="font-mono font-semibold">{formatINR(check.actual_amount)}</div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md bg-[--color-muted] px-3 py-2 text-xs">
            <span className="font-mono text-[--color-wolvio-orange]">{check.clause_reference} · Page {check.page_number}</span>
            <p className="mt-1 italic text-[--color-muted-foreground]">&ldquo;{check.source_clause}&rdquo;</p>
          </div>

          {check.explanation && (
            <p className="text-sm text-[--color-foreground]">{check.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}
