import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatINRShort } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ContractCardProps {
  id: string
  contractId: string
  displayName: string
  isDemo?: boolean
  annualFee?: number
  termYears?: number
  counterparty?: string
}

export function ContractCard({ contractId, displayName, isDemo, annualFee, termYears, counterparty }: ContractCardProps) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{displayName}</CardTitle>
          {isDemo && <Badge variant="demo">DEMO</Badge>}
        </div>
        <p className="text-sm text-[--color-muted-foreground]">
          {[counterparty, annualFee && formatINRShort(annualFee), termYears && `${termYears}yr`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={`/contracts/${contractId}`}>Open →</Link>
      </Button>
    </Card>
  )
}
