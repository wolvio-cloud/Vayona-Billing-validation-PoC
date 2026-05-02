'use client'

import { useState } from 'react'
import { formatINR } from '@/lib/utils'
import type { ValidationCheck } from '@/lib/schemas/validation'
import { ChevronDown, ChevronUp, Copy, Download, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ValidationLineItemProps {
  check: ValidationCheck
}

const VERDICT_BORDER: Record<ValidationCheck['verdict'], string> = {
  MATCH: 'border-[#10B981]',
  GAP: 'border-[#DC2626]',
  OPPORTUNITY: 'border-[#F59E0B]',
  INSUFFICIENT_DATA: 'border-[--color-wolvio-slate]',
}

const VERDICT_ICON: Record<ValidationCheck['verdict'], string> = {
  MATCH: '✓',
  GAP: '✗',
  OPPORTUNITY: '◎',
  INSUFFICIENT_DATA: '?',
}

export function ValidationLineItem({ check }: ValidationLineItemProps) {
  const [expanded, setExpanded] = useState(check.verdict === 'GAP' || check.verdict === 'OPPORTUNITY')
  const [showModal, setShowModal] = useState(false)

  const gapValue = check.gap_amount ?? check.opportunity_amount
  const borderClass = VERDICT_BORDER[check.verdict]

  return (
    <>
      <div className={`bg-white border border-[--color-wolvio-light] border-l-4 ${borderClass} rounded-[12px] shadow-[0_2px_8px_rgba(10,35,66,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_6px_16px_rgba(10,35,66,0.08)]`}>
        <button
          className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#FAFBFC]"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-4">
            <span className={`font-bold text-lg ${check.verdict === 'GAP' ? 'text-[#DC2626]' : check.verdict === 'OPPORTUNITY' ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
              {VERDICT_ICON[check.verdict]}
            </span>
            <span className="font-heading font-bold text-[--color-wolvio-navy] text-lg">{check.check_name}</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full ${check.verdict === 'GAP' ? 'bg-red-100 text-[#DC2626]' : check.verdict === 'OPPORTUNITY' ? 'bg-amber-100 text-[#F59E0B]' : 'bg-green-100 text-[#10B981]'}`}>
              {check.verdict}
            </span>
          </div>
          <div className="flex items-center gap-6">
            {gapValue != null && gapValue > 0 ? (
              <span className={`font-mono text-lg font-bold ${check.verdict === 'GAP' ? 'text-[#DC2626]' : 'text-[#F59E0B]'}`}>
                {formatINR(gapValue)}
              </span>
            ) : check.expected_amount != null ? (
              <span className="font-mono text-lg font-bold text-[--color-wolvio-slate]">
                {formatINR(check.expected_amount)}
              </span>
            ) : null}
            <div className="text-[--color-wolvio-light]">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-6 pb-6 pt-2 bg-white">
            <div className="rounded-[12px] border border-[--color-wolvio-light] overflow-hidden mb-6">
              <div className="grid grid-cols-3 divide-x divide-[--color-wolvio-light] bg-[#FAFBFC] border-b border-[--color-wolvio-light]">
                <div className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate] mb-1">Expected</div>
                  <div className="font-mono text-lg font-bold text-[--color-wolvio-navy]">{check.expected_amount != null ? formatINR(check.expected_amount) : '-'}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate] mb-1">Billed</div>
                  <div className="font-mono text-lg font-bold text-[--color-wolvio-navy]">{check.actual_amount != null ? formatINR(check.actual_amount) : '-'}</div>
                </div>
                <div className="p-4 bg-red-50/30">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate] mb-1">Gap</div>
                  <div className="font-mono text-xl font-bold text-[#DC2626]">{gapValue != null ? formatINR(gapValue) : '-'}</div>
                </div>
              </div>

              <div className="p-5 border-b border-[--color-wolvio-light]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[--color-wolvio-orange] text-xs font-semibold rounded-full border border-orange-100 mb-3">
                  {check.clause_reference} · Page {check.page_number}
                </div>
                <p className="italic text-sm text-[--color-wolvio-slate] leading-relaxed">
                  "{check.source_clause}"
                </p>
              </div>

              <div className="p-5 bg-white">
                <p className="text-[15px] font-medium text-[--color-wolvio-navy] leading-relaxed">
                  {check.explanation}
                </p>
              </div>
            </div>

            {(check.verdict === 'GAP' || check.verdict === 'OPPORTUNITY') && (
              <div className="flex justify-end">
                <Button 
                  className="bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white font-semibold px-6 shadow-sm"
                  onClick={() => setShowModal(true)}
                >
                  <Send className="w-4 h-4 mr-2" /> Send to Finance Controller
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[--color-wolvio-light] flex items-center justify-between bg-[--color-wolvio-navy] text-white">
              <h3 className="font-heading font-bold text-lg">Send to Finance Controller</h3>
              <button onClick={() => setShowModal(false)} className="text-[--color-wolvio-light] hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-[#FAFBFC] space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate]">To</div>
                <div className="text-sm font-medium text-[--color-wolvio-navy] bg-white p-2 rounded border border-[--color-wolvio-light]">finance.controller@siemensgamesa.com</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate]">Subject</div>
                <div className="text-sm font-medium text-[--color-wolvio-navy] bg-white p-2 rounded border border-[--color-wolvio-light]">
                  URGENT: Billing Discrepancy - {check.check_name} (INV-002)
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-[--color-wolvio-slate]">Message Draft</div>
                <div className="text-sm text-[--color-wolvio-navy] bg-white p-4 rounded border border-[--color-wolvio-light] whitespace-pre-wrap leading-relaxed">
                  Hi FC Team,{'\n\n'}
                  Our system has identified a discrepancy in invoice INV-002 regarding the {check.check_name}.{'\n\n'}
                  {check.explanation}{'\n\n'}
                  Details:{'\n'}
                  - Expected: {check.expected_amount != null ? formatINR(check.expected_amount) : '-'}{'\n'}
                  - Billed: {check.actual_amount != null ? formatINR(check.actual_amount) : '-'}{'\n'}
                  - Total Gap: {gapValue != null ? formatINR(gapValue) : '-'}{'\n\n'}
                  Please review and issue a corrective invoice/credit note as per {check.clause_reference}.{'\n\n'}
                  Regards,{'\n'}
                  Contract Execution Intelligence
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[--color-wolvio-light] bg-white flex justify-end gap-3">
              <Button variant="outline" className="border-[--color-wolvio-navy] text-[--color-wolvio-navy]" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="outline" className="border-[--color-wolvio-navy] text-[--color-wolvio-navy]">
                <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
              </Button>
              <Button className="bg-[--color-wolvio-navy] text-white hover:bg-[#081a33]">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
