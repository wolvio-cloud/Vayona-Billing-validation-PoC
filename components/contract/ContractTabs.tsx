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
        <TabsList className="bg-white border border-slate-200 p-1.5 rounded-full shadow-sm">
          <TabsTrigger 
            value="parameters" 
            className="rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide data-[state=active]:bg-wolvio-orange data-[state=active]:text-white text-slate-400 transition-all hover:text-slate-900"
          >
            Extracted Parameters
          </TabsTrigger>
          <TabsTrigger 
            value="simulate" 
            className="rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide data-[state=active]:bg-wolvio-orange data-[state=active]:text-white text-slate-400 transition-all hover:text-slate-900"
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
