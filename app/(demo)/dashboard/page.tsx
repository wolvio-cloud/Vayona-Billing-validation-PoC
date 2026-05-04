import { ContractCard } from '@/components/contract/ContractCard'
import { UploadFlow } from '@/components/upload/UploadFlow'
import { LayoutGrid, Zap, ShieldCheck, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import path from 'path'
import fs from 'fs/promises'

async function getPortfolio() {
  try {
    const p = path.join(process.cwd(), 'demo_data', 'portfolio.json')
    const raw = await fs.readFile(p, 'utf-8')
    return JSON.parse(raw) as PortfolioContract[]
  } catch {
    return FALLBACK_PORTFOLIO
  }
}

interface PortfolioContract {
  contract_id: string
  display_name: string
  contract_type: string
  asset_type: string
  counterparty: string
  location: string
  capacity_mw: number
  term_years: number
  base_annual_fee: number
  extraction_status: string
  risk_score: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  outstanding_gap_inr: number
  demo_highlight: string
}

const RISK_CONFIG = {
  LOW:      { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  dot: 'bg-green-400' },
  MEDIUM:   { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  dot: 'bg-amber-400' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    dot: 'bg-red-400 animate-pulse' },
}

const ASSET_ICON: Record<string, string> = {
  Wind: '🌀', Solar: '☀️', Hybrid: '⚡', Default: '🏭',
}

const FALLBACK_PORTFOLIO: PortfolioContract[] = [
  { contract_id: 'C001', display_name: 'Wind Farm Alpha — LTSA', contract_type: 'LTSA', asset_type: 'Wind', counterparty: 'GreenWind Power Pvt. Ltd.', location: 'Jaisalmer, Rajasthan', capacity_mw: 150, term_years: 15, base_annual_fee: 144000000, extraction_status: 'completed', risk_score: 'HIGH', outstanding_gap_inr: 5424000, demo_highlight: 'WPI escalation not applied — ₹5.42L gap' },
  { contract_id: 'C002', display_name: 'ReNew Power Mega-LTSA', contract_type: 'LTSA', asset_type: 'Wind', counterparty: 'Siemens Gamesa India', location: 'Kutch, Gujarat', capacity_mw: 300, term_years: 25, base_annual_fee: 480000000, extraction_status: 'completed', risk_score: 'CRITICAL', outstanding_gap_inr: 19200000, demo_highlight: 'LD rate 2.5%/PP — highest exposure' },
]

function formatCr(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`
  return `₹${val.toLocaleString('en-IN')}`
}

export default async function DashboardPage() {
  const portfolio = await getPortfolio()
  
  const totalGap = portfolio.reduce((s, c) => s + c.outstanding_gap_inr, 0)
  const criticalCount = portfolio.filter(c => c.risk_score === 'CRITICAL').length
  const totalCapacity = portfolio.reduce((s, c) => s + c.capacity_mw, 0)

  return (
    <div className="space-y-16 animate-fade-in-up">
      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/10 text-[--color-wolvio-orange] text-[10px] font-black tracking-[0.3em] uppercase">
            <Zap size={14} fill="currentColor" /> Intelligence Active
          </div>
          <h1 className="text-6xl font-heading font-black text-white tracking-tight">
            Command <span className="text-[--color-wolvio-orange]">Center.</span>
          </h1>
          <p className="text-xl text-[--color-wolvio-mid] font-medium max-w-2xl leading-relaxed">
            Enterprise contract intelligence — {portfolio.length} contracts monitored, {formatCr(totalGap)} in identified gaps.
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="glass px-8 py-6 rounded-[28px] border-none shadow-xl text-center min-w-[140px]">
            <div className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-1">Contracts</div>
            <div className="text-3xl font-mono font-black text-white">{portfolio.length}</div>
          </div>
          <div className="glass px-8 py-6 rounded-[28px] border-none shadow-xl text-center min-w-[140px]">
            <div className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-1">Capacity</div>
            <div className="text-3xl font-mono font-black text-white">{totalCapacity} <span className="text-base font-bold text-[--color-wolvio-mid]">MW</span></div>
          </div>
          <div className="glass px-8 py-6 rounded-[28px] border-none shadow-xl text-center min-w-[140px]">
            <div className="text-[10px] font-black text-[--color-wolvio-orange] uppercase tracking-widest mb-1">Gap Identified</div>
            <div className="text-3xl font-mono font-black text-[--color-wolvio-orange]">{formatCr(totalGap)}</div>
          </div>
          <div className="glass px-8 py-6 rounded-[28px] border-none shadow-xl text-center min-w-[140px]">
            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Critical Risk</div>
            <div className="text-3xl font-mono font-black text-red-400">{criticalCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,440px] gap-12 items-start">
        {/* Portfolio Risk Board */}
        <div className="space-y-8 order-2 xl:order-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Portfolio Risk Board</h2>
                <p className="text-[10px] font-bold text-[--color-wolvio-mid] uppercase tracking-widest">Real-time gap exposure by contract</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {portfolio.map((contract) => {
              const risk = RISK_CONFIG[contract.risk_score]
              const icon = ASSET_ICON[contract.asset_type] || ASSET_ICON.Default
              return (
                <Link
                  key={contract.contract_id}
                  href={`/contracts/${contract.contract_id}`}
                  className={`group glass rounded-[24px] p-6 border ${risk.border} hover:border-[--color-wolvio-orange]/40 transition-all hover:shadow-[0_8px_32px_rgba(242,102,48,0.15)] block`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-5 min-w-0">
                      <div className={`w-12 h-12 flex-shrink-0 rounded-2xl ${risk.bg} flex items-center justify-center text-2xl border ${risk.border}`}>
                        {icon}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest">{contract.contract_id}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${risk.bg} ${risk.color}`}>{contract.risk_score}</span>
                          <span className="text-[9px] font-bold text-white/20 uppercase">{contract.contract_type}</span>
                        </div>
                        <h3 className="text-base font-heading font-black text-white tracking-tight group-hover:text-[--color-wolvio-orange] transition-colors truncate">
                          {contract.display_name}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-[--color-wolvio-mid]">
                          <span>{contract.counterparty}</span>
                          <span className="opacity-30">·</span>
                          <span>{contract.location}</span>
                          <span className="opacity-30">·</span>
                          <span>{contract.capacity_mw} MW</span>
                        </div>
                        <p className="text-[11px] font-medium text-amber-400/70 mt-1 line-clamp-1">{contract.demo_highlight}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest">Gap Identified</div>
                      <div className={`text-xl font-mono font-black ${contract.outstanding_gap_inr > 0 ? 'text-[--color-wolvio-orange]' : 'text-green-400'}`}>
                        {contract.outstanding_gap_inr > 0 ? formatCr(contract.outstanding_gap_inr) : 'CLEAN'}
                      </div>
                      <div className="text-[9px] font-bold text-white/20">{formatCr(contract.base_annual_fee)}/yr</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Data Provenance Banner */}
          <div className="glass rounded-[20px] p-5 border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest">Data Provenance</div>
                <div className="text-[11px] font-bold text-white">WPI Index · Office of the Economic Adviser, GoI</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-green-400 uppercase tracking-widest">Cached</div>
              <div className="text-[10px] font-mono text-white/40">Jan 2025 snapshot</div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-8 order-1 xl:order-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[--color-wolvio-orange]/10 flex items-center justify-center border border-[--color-wolvio-orange]/20 text-[--color-wolvio-orange]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Audit Intelligence</h2>
              <p className="text-[10px] font-bold text-[--color-wolvio-mid] uppercase tracking-widest">Upload contract or invoice PDF</p>
            </div>
          </div>
          <div className="glass rounded-[40px] p-10 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
            <UploadFlow />
          </div>

          {/* Live Stats */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[--color-wolvio-mid] uppercase tracking-[0.3em] mb-4">Ecosystem Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-6 rounded-[24px] border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-[40px] -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
                <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-2 relative z-10">Revenue Recovered (YTD)</div>
                <div className="text-2xl font-mono font-black text-green-400 relative z-10">{formatCr(totalGap)}</div>
                <div className="text-[10px] font-bold text-green-400/60 mt-1">Across {portfolio.length} contracts</div>
              </div>
              <div className="glass p-6 rounded-[24px] border-white/5 relative overflow-hidden group hover:border-red-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-[40px] -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
                <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-2 relative z-10">Critical Alerts</div>
                <div className="text-2xl font-mono font-black text-red-400 relative z-10 flex items-center gap-2">
                  <AlertTriangle size={20} />{criticalCount}
                </div>
                <div className="text-[10px] font-bold text-red-400/60 mt-1">Require FC Action</div>
              </div>
              <div className="glass p-6 rounded-[24px] border-white/5 col-span-2 flex items-center justify-between group hover:bg-white/5 transition-colors cursor-pointer">
                <div>
                  <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-1">ERP Connection Status</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    SAP S/4HANA (PRD)
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-white/40">Ping: 12ms</div>
              </div>
              <div className="glass p-6 rounded-[24px] border-white/5 col-span-2">
                <div className="text-[9px] font-black text-[--color-wolvio-mid] uppercase tracking-widest mb-3">Total Portfolio Under Management</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-mono font-black text-white">{totalCapacity} <span className="text-base font-bold text-[--color-wolvio-mid]">MW</span></div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-[--color-wolvio-mid]">Annual Contract Value</div>
                    <div className="text-xl font-mono font-black text-[--color-wolvio-orange]">{formatCr(portfolio.reduce((s,c) => s + c.base_annual_fee, 0))}</div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[--color-wolvio-orange] to-amber-400 rounded-full" style={{ width: '68%' }} />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-white/30 mt-1.5">
                  <span>68% audited this month</span>
                  <span>{formatCr(totalGap)} gaps found</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
