'use client'

import { ContractCard } from '@/components/contract/ContractCard'
import { UploadFlow } from '@/components/upload/UploadFlow'
import { LayoutGrid, History, Zap, ShieldCheck, BarChart3 } from 'lucide-react'

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
  {
    id: 'demo-2',
    contractId: 'C002',
    displayName: 'ReNew Power Mega-LTSA',
    isDemo: true,
    annualFee: 480000000,
    termYears: 25,
    counterparty: 'Siemens Gamesa',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-16 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/10 text-[--color-wolvio-orange] text-[10px] font-black tracking-[0.3em] uppercase">
            <Zap size={14} fill="currentColor" /> System Online
          </div>
          <h1 className="text-6xl font-heading font-black text-white tracking-tight">
            Command <span className="text-[--color-wolvio-orange]">Center.</span>
          </h1>
          <p className="text-xl text-[--color-wolvio-mid] font-medium max-w-2xl leading-relaxed">
            Enterprise contract intelligence & revenue leakage monitoring.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass px-8 py-6 rounded-[28px] border-none shadow-xl text-center min-w-[160px]">
            <div className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-1">Active Assets</div>
            <div className="text-3xl font-mono font-black text-white">42</div>
          </div>
          <div className="glass px-8 py-6 rounded-[28px] border-none shadow-xl text-center min-w-[160px]">
            <div className="text-[10px] font-black text-[--color-wolvio-orange] uppercase tracking-widest mb-1">Audit Score</div>
            <div className="text-3xl font-mono font-black text-[--color-wolvio-orange]">98.2%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,500px] gap-12 items-start">
        {/* Recent Contracts / Pinned */}
        <div className="space-y-8 order-2 xl:order-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <BarChart3 size={24} />
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Active Portfolios</h2>
            </div>
            <button className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-widest hover:text-[--color-wolvio-orange] transition-colors">View Library</button>
          </div>
          
          <div className="space-y-6">
            {DEMO_CONTRACTS.map((c) => (
              <ContractCard key={c.id} {...c} />
            ))}
            
            {/* Empty State placeholder for visual balance */}
            <div className="glass rounded-[32px] p-12 border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-30">
              <LayoutGrid size={40} className="mb-4 text-[--color-wolvio-mid]" />
              <p className="text-xs font-bold text-[--color-wolvio-mid] uppercase tracking-widest leading-relaxed">
                Repository End <br /> Synchronized with MSA
              </p>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-8 order-1 xl:order-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[--color-wolvio-orange]/10 flex items-center justify-center border border-[--color-wolvio-orange]/20 text-[--color-wolvio-orange]">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Audit Intelligence</h2>
          </div>
          <div className="glass rounded-[40px] p-10 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
            <UploadFlow />
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-[24px] border-white/5">
              <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-1">Precision</div>
              <div className="text-xl font-mono font-black text-green-400">99.9%</div>
            </div>
            <div className="glass p-6 rounded-[24px] border-white/5">
              <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-1">Response</div>
              <div className="text-xl font-mono font-black text-blue-400">&lt;1.2s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
