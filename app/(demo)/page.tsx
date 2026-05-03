import { ContractCard } from '@/components/contract/ContractCard'
import { UploadFlow } from '@/components/upload/UploadFlow'
import { LayoutGrid, History, Zap } from 'lucide-react'

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
    <div className="max-w-6xl mx-auto py-16 px-8 space-y-16 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 text-[--color-wolvio-orange] text-[10px] font-black tracking-[0.2em] uppercase">
          <Zap size={14} fill="currentColor" /> Live Intelligence
        </div>
        <h1 className="text-5xl font-heading font-black text-white tracking-tight">
          Contract Command <span className="text-[--color-wolvio-orange]">Center.</span>
        </h1>
        <p className="text-xl text-[--color-wolvio-mid] font-medium max-w-2xl leading-relaxed">
          Monitor revenue leakage, audit commercial clauses, and secure your long-term service agreements with high-precision AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Upload Action */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[--color-wolvio-orange]/10 flex items-center justify-center border border-[--color-wolvio-orange]/20 text-[--color-wolvio-orange]">
              <Zap size={20} />
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Initialize New Audit</h2>
          </div>
          <div className="glass rounded-[32px] p-8 border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <UploadFlow />
          </div>
        </div>

        {/* Recent Contracts / Pinned */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <History size={20} />
              </div>
              <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Active Portfolios</h2>
            </div>
            <button className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-widest hover:text-[--color-wolvio-orange] transition-colors">View All</button>
          </div>
          
          <div className="space-y-6">
            {DEMO_CONTRACTS.map((c) => (
              <ContractCard key={c.id} {...c} />
            ))}
            
            {/* Empty State placeholder for visual balance */}
            <div className="glass rounded-[28px] p-10 border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-40">
              <LayoutGrid size={32} className="mb-4 text-[--color-wolvio-mid]" />
              <p className="text-xs font-bold text-[--color-wolvio-mid] uppercase tracking-widest leading-relaxed">
                No Other active <br /> portfolios found
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Micro-Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Platform Uptime', value: '99.99%', color: 'text-green-400' },
          { label: 'Audit Precision', value: '99.8%', color: 'text-[--color-wolvio-orange]' },
          { label: 'Revenue Recovered', value: '₹4.2Cr', color: 'text-blue-400' }
        ].map((stat, i) => (
          <div key={i} className="glass px-8 py-6 rounded-[24px] border-white/5">
            <div className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-[0.3em] mb-2">{stat.label}</div>
            <div className={`text-2xl font-mono font-black ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
