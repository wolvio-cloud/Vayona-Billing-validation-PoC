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
}

const VERDICT_THEME: Record<ValidationCheck['verdict'], { color: string, icon: any, bg: string }> = {
  MATCH: { color: 'text-[--color-wolvio-green]', icon: CheckCircle2, bg: 'bg-[--color-wolvio-green]/10' },
  GAP: { color: 'text-[--color-wolvio-red]', icon: XCircle, bg: 'bg-[--color-wolvio-red]/10' },
  OPPORTUNITY: { color: 'text-[--color-wolvio-amber]', icon: AlertTriangle, bg: 'bg-[--color-wolvio-amber]/10' },
  INSUFFICIENT_DATA: { color: 'text-[--color-wolvio-mid]', icon: Info, bg: 'bg-white/5' },
}

export function ValidationLineItem({ check }: ValidationLineItemProps) {
  const [expanded, setExpanded] = useState(check.verdict === 'GAP' || check.verdict === 'OPPORTUNITY')
  const [showSAP, setShowSAP] = useState(false)
  
  const theme = VERDICT_THEME[check.verdict]
  const Icon = theme.icon

  const gapValue = check.gap_amount ?? check.opportunity_amount

  const generateSAPPayload = () => {
    return {
      HEADER: {
        INVOICE_ID: `CORR-${check.check_id.slice(-4)}-${Date.now().toString().slice(-4)}`,
        DOC_TYPE: 'RE',
        COMP_CODE: 'SG01',
        CURRENCY: 'INR',
        HEADER_TEXT: `Adjustment: ${check.check_name} | Ref: ${check.clause_reference}`
      },
      ITEM_DATA: [
        {
          INVOICE_DOC_ITEM: '000001',
          GL_ACCOUNT: check.verdict === 'GAP' ? '410020' : '410030',
          ITEM_AMOUNT: gapValue,
          TAX_CODE: 'I1',
          COSTCENTER: 'CC_WIND_TN_01',
          TEXT: `Variance found in ${check.check_name} calculation`
        }
      ]
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
            <div className="space-y-1">
              <h4 className="font-heading font-black text-white text-lg tracking-tight">{check.check_name}</h4>
              <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 ${theme.color}`}>
                {check.verdict}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="text-right">
              {gapValue != null && gapValue > 0 ? (
                <div className={`font-mono text-xl font-black ${theme.color} tracking-tighter`}>
                  {formatINR(gapValue)}
                </div>
              ) : check.expected_amount != null ? (
                <div className="font-mono text-xl font-black text-white/40 tracking-tighter">
                  {formatINR(check.expected_amount)}
                </div>
              ) : null}
              <div className="text-[10px] font-bold text-[--color-wolvio-mid] uppercase tracking-widest mt-1">Variance</div>
            </div>
            <div className="text-white/20 group-hover:text-[--color-wolvio-orange] transition-colors">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white/5 rounded-[24px] border border-white/5 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-white/5 bg-white/5 border-b border-white/5">
                <div className="p-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[--color-wolvio-mid] mb-2">Entitlement</div>
                  <div className="font-mono text-lg font-black text-white">{check.expected_amount != null ? formatINR(check.expected_amount) : '-'}</div>
                </div>
                <div className="p-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[--color-wolvio-mid] mb-2">Actual Billed</div>
                  <div className="font-mono text-lg font-black text-white">{check.actual_amount != null ? formatINR(check.actual_amount) : '-'}</div>
                </div>
                <div className={`p-6 ${gapValue ? 'bg-white/5' : ''}`}>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[--color-wolvio-mid] mb-2">Variance</div>
                  <div className={`font-mono text-xl font-black ${theme.color}`}>{gapValue != null ? formatINR(gapValue) : '₹0'}</div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[--color-wolvio-orange] border border-white/10 uppercase tracking-widest">
                    Reference: {check.clause_reference} · Pg {check.page_number}
                  </div>
                </div>
                
                <p className="text-sm text-[--color-wolvio-mid] leading-relaxed italic border-l-2 border-white/10 pl-6 py-2">
                  "{check.source_clause}"
                </p>

                <div className="bg-white/5 rounded-2xl p-6">
                  <p className="text-base font-semibold text-white/90 leading-relaxed">
                  {typeof check.explanation === 'string' ? check.explanation : (check.explanation as any)?.cfo_summary || 'Analysis not available.'}
                  </p>
                </div>

                {(check.verdict === 'GAP' || check.verdict === 'OPPORTUNITY') && (
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      className="py-6 px-8 border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/5"
                      onClick={() => setShowSAP(true)}
                    >
                      <Terminal className="w-4 h-4 mr-3 text-[--color-wolvio-orange]" /> SAP Ready
                    </Button>
                    <Button className="bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white font-black text-xs uppercase tracking-widest px-8 py-6 rounded-xl shadow-lg group">
                      Notify Controller <Send className="w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </div>
                )}
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


