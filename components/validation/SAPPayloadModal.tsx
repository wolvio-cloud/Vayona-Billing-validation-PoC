'use client'

import { useState } from 'react'
import { X, Copy, Check, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { cn } from '@/lib/utils'

interface SAPPayloadModalProps {
  isOpen: boolean
  onClose: () => void
  payload: any
  checkName: string
}

export function SAPPayloadModal({ isOpen, onClose, payload, checkName }: SAPPayloadModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-wolvio-orange/10 flex items-center justify-center border border-wolvio-orange/20 text-wolvio-orange">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black text-slate-900 tracking-tight">SAP Corrective Payload</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Correcting: {checkName}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">JSON Structure (BAPI_INCOMINGINVOICE)</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 text-[10px] font-black uppercase tracking-widest text-wolvio-orange hover:bg-wolvio-orange/10"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-2" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-2" /> Copy Payload
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 font-mono text-[13px] leading-relaxed overflow-auto max-h-[350px] scrollbar-thin scrollbar-thumb-white/10">
                <pre className="text-emerald-400">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-wolvio-orange/5 border border-wolvio-orange/20 rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="text-wolvio-orange mt-1">
                  <Check size={18} />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  This payload is pre-formatted for direct integration with **SAP BAPI** or **Oracle ERP Cloud**. 
                  It includes the specific variance amount and cites the contract clause in the header text for auditor clearance.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="py-6 px-8 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100"
            >
              Close
            </Button>
            <Button 
              className="py-6 px-8 bg-wolvio-orange text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg"
              disabled
            >
              Push to SAP (Dev Only)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
