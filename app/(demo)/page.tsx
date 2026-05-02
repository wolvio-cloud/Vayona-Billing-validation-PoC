import { ContractCard } from '@/components/contract/ContractCard'
import { DropZone } from '@/components/upload/DropZone'
import { Separator } from '@/components/ui/separator'

// TODO Phase 2: replace with data from Supabase
const DEMO_CONTRACTS = [
  {
    id: 'demo-1',
    contractId: 'C001',
    displayName: 'Wind Farm Alpha LTSA',
    isDemo: true,
    annualFee: 144000000,
    termYears: 15,
    counterparty: 'GreenWind Power',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[--color-wolvio-navy] mb-4">Upload Contract</h2>
        {/* DropZone is a client component — wrap when wiring up upload logic */}
        <div className="rounded-xl border-2 border-dashed border-[--color-mid] bg-[--color-off] py-12 px-8 text-center text-[--color-muted-foreground]">
          <p className="font-medium">Drag &amp; drop contract PDF here</p>
          <p className="text-sm mt-1">or click to upload</p>
          <p className="text-xs mt-3 opacity-60">(upload wired in Phase 3)</p>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold text-[--color-wolvio-navy] mb-4">Demo Contracts</h2>
        <div className="space-y-3">
          {DEMO_CONTRACTS.map((c) => (
            <ContractCard key={c.id} {...c} />
          ))}
        </div>
      </div>
    </div>
  )
}
