import { ContractCard } from '@/components/contract/ContractCard'
import { UploadFlow } from '@/components/upload/UploadFlow'
import { Separator } from '@/components/ui/separator'

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
    <div className="space-y-8 max-w-4xl mx-auto py-8 px-4">
      <div>
        <h2 className="text-xl font-semibold text-[--color-wolvio-navy] mb-4">Upload Contract</h2>
        <UploadFlow />
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
