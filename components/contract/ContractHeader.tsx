import { Badge } from '@/components/ui/badge'
import { formatINRShort } from '@/lib/utils'

interface ContractHeaderProps {
  displayName: string
  isDemo?: boolean
  annualFee?: number
  termYears?: number
  counterparty?: string
}

export function ContractHeader({ displayName, isDemo, annualFee, termYears, counterparty }: ContractHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[--color-wolvio-navy]">{displayName}</h1>
          {isDemo && <Badge variant="demo">DEMO</Badge>}
        </div>
        <p className="text-sm text-[--color-muted-foreground] mt-1">
          {[counterparty, annualFee && formatINRShort(annualFee), termYears && `${termYears} years`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </div>
  )
}
