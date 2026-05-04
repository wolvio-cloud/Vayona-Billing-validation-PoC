'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContractSimulator } from './ContractSimulator'
import { ContractParameters } from '@/lib/schemas/contract'

interface ContractTabsProps {
  children: React.ReactNode
  contract: ContractParameters
  termYears: number
}

export function ContractTabs({ children, contract, termYears }: ContractTabsProps) {
  return (
    <Tabs defaultValue="parameters" className="w-full">
      <div className="flex justify-center mb-8">
        <TabsList className="bg-[--color-wolvio-surface] border border-wolvio-slate p-1.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <TabsTrigger 
            value="parameters" 
            className="rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide data-[state=active]:bg-wolvio-orange data-[state=active]:text-white text-wolvio-mid transition-all"
          >
            Extracted Parameters
          </TabsTrigger>
          <TabsTrigger 
            value="simulate" 
            className="rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide data-[state=active]:bg-wolvio-orange data-[state=active]:text-white text-wolvio-mid transition-all"
          >
            Simulate Scenarios
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="parameters" className="animate-in fade-in duration-500 outline-none">
        {children}
      </TabsContent>

      <TabsContent value="simulate" className="animate-in fade-in duration-500 outline-none">
        <ContractSimulator contract={contract} termYears={termYears} />
      </TabsContent>
    </Tabs>
  )
}
