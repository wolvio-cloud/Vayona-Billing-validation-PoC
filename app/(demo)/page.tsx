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
    <div className="max-w-3xl mx-auto py-16 px-6 flex flex-col gap-12 items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full">
        <UploadFlow />
      </div>

      <div className="flex items-center w-full gap-4 text-[--color-wolvio-slate]">
        <Separator className="flex-1 bg-[--color-wolvio-mid]" />
        <span className="text-sm font-medium tracking-wide">or</span>
        <Separator className="flex-1 bg-[--color-wolvio-mid]" />
      </div>

      <div className="w-full">
        {DEMO_CONTRACTS.map((c) => (
          <ContractCard key={c.id} {...c} />
        ))}
      </div>
    </div>
  )
}
