import { PortfolioBoard } from '@/components/dashboard/PortfolioBoard'
import { UploadFlow } from '@/components/upload/UploadFlow'
import { BarChart3, ShieldCheck, AlertTriangle } from 'lucide-react'
import path from 'path'
import fs from 'fs/promises'

import sql from '@/lib/db'

async function getPortfolio() {
  try {
    const contracts = await sql`
      SELECT 
        contract_id, 
        display_name, 
        extraction_status,
        parameters->>'contract_type' as contract_type,
        parameters->'base_annual_fee'->'value' as annual_fee,
        created_at
      FROM contracts 
      ORDER BY created_at DESC
    `
    if (contracts.length === 0) throw new Error('Empty DB')
    
    return contracts.map((c: any) => ({
      contract_id: c.contract_id,
      display_name: c.display_name,
      contract_type: c.contract_type || 'LTSA',
      asset_type: c.contract_id === 'C001' ? 'Wind' : 'Solar',
      counterparty: c.contract_id === 'C001' ? 'GreenWind Power' : 'Siemens Gamesa',
      location: 'India Cluster', 
      capacity_mw: c.contract_id === 'C001' ? 150 : 300,
      term_years: 15,
      base_annual_fee: parseInt(c.annual_fee || '0'),
      extraction_status: c.extraction_status,
      risk_score: c.contract_id === 'C001' ? 'HIGH' : 'LOW',
      outstanding_gap_inr: c.contract_id === 'C001' ? 347520 : 0,
      demo_highlight: c.contract_id === 'C001' ? 'WPI escalation variance — ₹3.47L gap' : 'Audit complete — no gaps'
    })) as PortfolioContract[]
  } catch (err) {
    console.warn('Dashboard falling back to JSON:', err)
    const p = path.join(process.cwd(), 'demo_data', 'portfolio.json')
    if (path.extname(p) === '.json') {
      try {
        const raw = await fs.readFile(p, 'utf-8')
        return JSON.parse(raw) as PortfolioContract[]
      } catch (e) {
         return []
      }
    }
    return []
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
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-black text-slate-900 tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
            Monitoring {portfolio.length} active contracts and auditing billing discrepancies.
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm text-center min-w-[120px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contracts</div>
            <div className="text-2xl font-mono font-bold text-slate-900">{portfolio.length}</div>
          </div>
          <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm text-center min-w-[120px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gap</div>
            <div className="text-2xl font-mono font-bold text-wolvio-orange">{formatCr(totalGap)}</div>
          </div>
          <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm text-center min-w-[120px]">
            <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Critical</div>
            <div className="text-2xl font-mono font-bold text-red-600">{criticalCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,440px] gap-12 items-start">
        {/* Portfolio Risk Board */}
        <div className="space-y-8 order-2 xl:order-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em]">Portfolio Risk Board</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time gap exposure by contract</p>
              </div>
            </div>
          </div>

          <PortfolioBoard initialContracts={portfolio} />

          {/* Data Provenance Banner */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Provenance</div>
                <div className="text-[11px] font-bold text-slate-900">WPI Index · Office of the Economic Adviser, GoI</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Cached</div>
              <div className="text-[10px] font-mono text-slate-400">Jan 2025 snapshot</div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-8 order-1 xl:order-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 text-wolvio-orange">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em]">Audit Intelligence</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload contract or invoice PDF</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <UploadFlow />
          </div>

          {/* Live Stats */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Ecosystem Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 group hover:border-wolvio-orange/20 transition-colors shadow-sm">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Recovered (YTD)</div>
                <div className="text-xl font-mono font-bold text-emerald-600 relative z-10">{formatCr(totalGap)}</div>
                <div className="text-[10px] font-medium text-emerald-600/60 mt-1">Across {portfolio.length} assets</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 group hover:border-wolvio-orange/20 transition-colors shadow-sm">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Critical Alerts</div>
                <div className="text-xl font-mono font-bold text-red-600 relative z-10 flex items-center gap-2">
                  <AlertTriangle size={16} />{criticalCount}
                </div>
                <div className="text-[10px] font-medium text-red-600/60 mt-1">Require Action</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 col-span-2 flex items-center justify-between group hover:border-wolvio-orange/20 transition-colors shadow-sm">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ERP Connection Status</div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    SAP S/4HANA
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-300">12ms</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 col-span-2 shadow-sm">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Portfolio Under Management</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-mono font-black text-slate-900">{totalCapacity} <span className="text-base font-bold text-slate-400">MW</span></div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">Annual Contract Value</div>
                    <div className="text-xl font-mono font-black text-wolvio-orange">{formatCr(portfolio.reduce((s,c) => s + c.base_annual_fee, 0))}</div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-wolvio-orange to-amber-500 rounded-full" style={{ width: '68%' }} />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1.5">
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
