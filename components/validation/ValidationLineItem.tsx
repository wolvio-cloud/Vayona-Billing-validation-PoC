'use client'

import { useState } from 'react'
import { formatINR } from '@/lib/utils'
import type { ValidationCheck } from '@/lib/schemas/validation'
import { ChevronDown, ChevronUp, Send, CheckCircle2, AlertTriangle, XCircle, Info, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SAPPayloadModal } from './SAPPayloadModal'

interface ValidationLineItemProps {
  check: ValidationCheck
  showFormula?: boolean
}

const VERDICT_THEME: Record<ValidationCheck['verdict'], { color: string, icon: any, bg: string }> = {
  MATCH: { color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-50' },
  GAP: { color: 'text-red-600', icon: XCircle, bg: 'bg-red-50' },
  OPPORTUNITY: { color: 'text-amber-600', icon: AlertTriangle, bg: 'bg-amber-50' },
  INSUFFICIENT_DATA: { color: 'text-slate-400', icon: Info, bg: 'bg-slate-100' },
  ERROR: { color: 'text-slate-600', icon: Info, bg: 'bg-slate-200' },
}

export function ValidationLineItem({ check, showFormula = false }: ValidationLineItemProps) {
  const [expanded, setExpanded] = useState(showFormula || check.verdict === 'GAP' || check.verdict === 'OPPORTUNITY')
  const [showSAP, setShowSAP] = useState(false)
  const [isNotifying, setIsNotifying] = useState(false)
  const [isNotified, setIsNotified] = useState(false)
  
  const theme = VERDICT_THEME[check.verdict]
  const Icon = theme.icon

  const gapValue = check.gap_amount ?? check.opportunity_amount

  const generateSAPPayload = () => {
    return {
      "action": "CREATE_CORRECTIVE_INVOICE",
      "doc_type": "RV",
      "customer_code": "CUST-GW-001",
      "reference_invoice": "INV-002",
      "line_items": [{
        "description": `${check.check_name} Correction — April 2025`,
        "amount": gapValue,
        "currency": "INR",
        "cost_center": `CC-WIND-${check.check_id.includes('C001') ? 'C001' : 'GENERIC'}`,
        "contract_ref": "C001",
        "clause_ref": `${check.clause_reference}, Page ${check.page_number}`
      }],
      "total_amount": gapValue,
      "currency": "INR",
      "generated_by": "Wolvio CEI v1.0",
      "timestamp": new Date().toISOString(),
      "requires_fc_approval": true,
      "approval_status": "PENDING"
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-wolvio-orange/20 shadow-sm">
        <button
          className="w-full flex items-center justify-between px-8 py-7 text-left group"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-8">
            <div className={`w-12 h-12 ${theme.bg} rounded-xl flex items-center justify-center transition-all`}>
              <Icon className={theme.color} size={24} />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-heading font-bold text-slate-900 text-lg tracking-tight truncate">{check.check_name}</h4>
              <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100 whitespace-nowrap bg-slate-50 ${theme.color}`}>
                {check.verdict}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="text-right">
              <div className={`font-mono text-lg font-bold tracking-tight ${gapValue != null && gapValue > 0 ? theme.color : 'text-slate-400'}`}>
                {formatINR(gapValue || 0)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {gapValue != null && gapValue > 0 ? 'Variance' : 'Match'}
              </div>
            </div>
            <div className="text-slate-300 group-hover:text-wolvio-orange transition-colors">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
              {/* Row 1: Side-by-Side Comparison */}
              <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-100/50 border-b border-slate-200">
                <div className="p-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Expected Amount</div>
                  <div className="font-mono text-xl font-bold text-slate-900">{check.expected_amount != null ? formatINR(check.expected_amount) : '-'}</div>
                </div>
                <div className="p-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Actual Billed</div>
                  <div className="font-mono text-xl font-bold text-slate-900">{check.actual_amount != null ? formatINR(check.actual_amount) : '-'}</div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-8 space-y-8">
                {/* Row 2: Gap Amount */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identified Variance</div>
                  <div className="font-mono text-5xl font-bold text-red-600 tracking-tighter">
                    {gapValue != null ? formatINR(gapValue) : '₹0'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                  <div className="space-y-6">
                    {/* Row 3: Clause Pill */}
                    <div className="flex">
                      <div className="px-4 py-1.5 bg-wolvio-orange text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-wolvio-orange/20">
                        {check.clause_reference} · Page {check.page_number}
                      </div>
                    </div>

                    {/* Row 4: Verbatim Source */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verbatim Source Clause</div>
                      <p className="text-sm italic text-slate-500 leading-relaxed border-l-2 border-wolvio-orange/30 pl-6 py-1">
                        "{check.source_clause}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Row 5: Plain English Explanation */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Audit Findings</div>
                      <p className="text-base font-bold text-slate-900 leading-relaxed">
                        {typeof check.explanation === 'string' ? check.explanation : (check.explanation as any)?.cfo_summary || 'Analysis not available.'}
                      </p>
                    </div>

                    {/* Row 6: Corrective Action */}
                    <div className="flex gap-4">
                      <Button 
                        className="flex-1 bg-wolvio-orange hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-widest px-6 py-5 rounded-xl shadow-md transition-all"
                        onClick={() => setShowSAP(true)}
                      >
                        Generate Corrective Action
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SAPPayloadModal 
        isOpen={showSAP}
        onClose={() => setShowSAP(false)}
        checkName={check.check_name}
        payload={generateSAPPayload()}
      />
    </>
  )
}
