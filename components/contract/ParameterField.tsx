'use client'

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface ParameterFieldProps {
  label: string
  value: string
  clauseReference: string
  pageNumber: number
  sourceClause: string
  confidence?: 'high' | 'medium' | 'low'
}

export function ParameterField({ label, value, clauseReference, pageNumber, sourceClause, confidence }: ParameterFieldProps) {
  const confidenceColor = confidence === 'high' ? 'text-[--color-wolvio-green]' : confidence === 'low' ? 'text-[--color-wolvio-red]' : 'text-[--color-wolvio-amber]'

  return (
    <TooltipProvider>
      <div className="grid grid-cols-[180px,1fr] border-b border-[--color-border] py-3 last:border-0">
        <div className="text-sm font-medium text-[--color-wolvio-slate]">{label}</div>
        <div className="space-y-0.5">
          <div className="text-sm font-semibold">{value}</div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-xs font-mono text-[--color-wolvio-orange] hover:underline cursor-help">
                  {clauseReference} · Page {pageNumber} ↗
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{sourceClause}</TooltipContent>
            </Tooltip>
            {confidence && (
              <span className={`text-xs ${confidenceColor}`}>{confidence}</span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
