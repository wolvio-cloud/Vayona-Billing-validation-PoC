'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  LOW:      { color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100', dot: 'bg-emerald-500' },
  MEDIUM:   { color: 'text-amber-600',  bg: 'bg-amber-50',    border: 'border-amber-100',   dot: 'bg-amber-500' },
  HIGH:     { color: 'text-orange-600', bg: 'bg-orange-50',   border: 'border-orange-100',  dot: 'bg-orange-500' },
  CRITICAL: { color: 'text-red-600',    bg: 'bg-red-50',      border: 'border-red-100',     dot: 'bg-red-500 animate-pulse' },
}

const ASSET_ICON: Record<string, string> = {
  Wind: '🌀', Solar: '☀️', Hybrid: '⚡', Default: '🏭',
}

function formatCr(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`
  return `₹${val.toLocaleString('en-IN')}`
}

export function PortfolioBoard({ initialContracts }: { initialContracts: PortfolioContract[] }) {
  const [contracts, setContracts] = useState(initialContracts)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this contract and all its associated data?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setContracts(contracts.filter(c => c.contract_id !== id))
        router.refresh()
      } else {
        alert('Failed to delete contract')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting contract')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const risk = RISK_CONFIG[contract.risk_score]
        const icon = ASSET_ICON[contract.asset_type] || ASSET_ICON.Default
        const isDeleting = deletingId === contract.contract_id

        return (
          <div key={contract.contract_id} className="relative group">
            <Link
              href={`/contracts/${contract.contract_id}`}
              className={`block bg-white rounded-xl p-6 border ${risk.border} hover:border-wolvio-orange/30 transition-all shadow-sm ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-5 min-w-0">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-xl ${risk.bg} flex items-center justify-center text-2xl border ${risk.border}`}>
                    {icon}
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-black font-mono tracking-widest">{contract.contract_id}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${risk.bg} ${risk.color} border ${risk.border}`}>
                        {contract.risk_score}
                      </span>
                      <div className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {contract.contract_type}
                      </div>
                    </div>
                    <h3 className="text-xl font-heading font-black text-slate-900 tracking-tight group-hover:text-wolvio-orange transition-colors truncate">
                      {contract.display_name}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                      <span className="text-wolvio-orange">{contract.location}</span>
                      <span className="opacity-20">|</span>
                      <span>{contract.counterparty}</span>
                      <span className="opacity-20">|</span>
                      <span className="font-mono">{contract.capacity_mw}MW</span>
                    </div>
                    <div className="bg-wolvio-orange/5 border border-wolvio-orange/10 rounded-lg px-3 py-1 mt-2 inline-block">
                      <p className="text-[10px] font-bold text-wolvio-orange/90 italic tracking-wide">{contract.demo_highlight}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right space-y-2 pr-8">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Exposure</div>
                  <div className="text-xl font-mono font-bold text-slate-900 tracking-tight">
                    {formatCr(contract.base_annual_fee)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unrealized Gaps</div>
                    <div className={`font-mono text-sm font-black ${contract.outstanding_gap_inr > 0 ? 'text-wolvio-orange' : 'text-wolvio-green'}`}>
                      {contract.outstanding_gap_inr > 0 ? formatCr(contract.outstanding_gap_inr) : 'CLEAN'}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Delete Button */}
            <button
              onClick={(e) => handleDelete(e, contract.contract_id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-full border border-transparent hover:border-red-100 hover:bg-red-50 z-20"
              title="Delete Contract"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        )
      })}
      
      {contracts.length === 0 && (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
          <AlertCircle size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No contracts found in portfolio.</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Upload a contract to begin audit</p>
        </div>
      )}
    </div>
  )
}
