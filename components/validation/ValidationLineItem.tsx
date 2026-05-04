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
  MATCH: { color: 'text-wolvio-green', icon: CheckCircle2, bg: 'bg-wolvio-green/10' },
  GAP: { color: 'text-wolvio-red', icon: XCircle, bg: 'bg-wolvio-red/10' },
  OPPORTUNITY: { color: 'text-wolvio-amber', icon: AlertTriangle, bg: 'bg-wolvio-amber/10' },
  INSUFFICIENT_DATA: { color: 'text-wolvio-mid', icon: Info, bg: 'bg-white/5' },
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
      <GlassCard hover className="border-none shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)]">
        <button
          className="w-full flex items-center justify-between px-8 py-7 text-left group"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-6">
            <div className={`w-12 h-12 ${theme.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <Icon className={theme.color} size={24} />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h4 className="font-heading font-black text-white text-lg tracking-tight truncate">{check.check_name}</h4>
              <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/5 whitespace-nowrap ${theme.color}`}>
                {check.verdict}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="text-right">
              <div className={`font-mono text-xl font-black tracking-tighter ${gapValue != null && gapValue > 0 ? theme.color : 'text-white/40'}`}>
                {formatINR(gapValue || 0)}
              </div>
              <div className="text-[10px] font-bold text-wolvio-mid uppercase tracking-widest mt-1">
                {gapValue != null && gapValue > 0 ? 'Variance' : 'Match'}
              </div>
            </div>
            <div className="text-white/20 group-hover:text-wolvio-orange transition-colors">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white/5 rounded-[32px] border border-white/5 overflow-hidden">
              {/* Row 1: Side-by-Side Comparison */}
              <div className="grid grid-cols-2 divide-x divide-white/5 bg-white/5 border-b border-white/5">
                <div className="p-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-wolvio-mid mb-3">Expected (Per Contract)</div>
                  <div className="font-mono text-2xl font-black text-white">{check.expected_amount != null ? formatINR(check.expected_amount) : '-'}</div>
                </div>
                <div className="p-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-wolvio-mid mb-3">Actual (Billed)</div>
                  <div className="font-mono text-2xl font-black text-white">{check.actual_amount != null ? formatINR(check.actual_amount) : '-'}</div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-10 space-y-10">
                {/* Row 2: Gap Amount */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-wolvio-red">Identified Variance</div>
                  <div className="font-mono text-5xl font-black text-wolvio-red tracking-tighter">
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
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-wolvio-mid/40">Verbatim Source Clause</div>
                      <p className="text-sm italic text-wolvio-slate leading-relaxed border-l-2 border-wolvio-orange/30 pl-6 py-1">
                        "{check.source_clause}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Row 5: Plain English Explanation */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-wolvio-mid/40">Audit Findings</div>
                      <p className="text-base font-bold text-white leading-relaxed">
                        {typeof check.explanation === 'string' ? check.explanation : (check.explanation as any)?.cfo_summary || 'Analysis not available.'}
                      </p>
                    </div>

                    {/* Row 6: Corrective Action */}
                    <div className="flex gap-4">
                      <Button 
                        className="flex-1 bg-wolvio-orange hover:bg-[#d95a2b] text-white font-black text-xs uppercase tracking-widest px-8 py-7 rounded-2xl shadow-xl shadow-wolvio-orange/10 group"
                        onClick={() => setShowSAP(true)}
                      >
                        Create Corrective Invoice <Terminal className="w-4 h-4 ml-3 group-hover:rotate-12 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      <SAPPayloadModal 
        isOpen={showSAP}
        onClose={() => setShowSAP(false)}
        checkName={check.check_name}
        payload={generateSAPPayload()}
      />
    </>
  )
}
