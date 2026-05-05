'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AlertCircle, ShieldCheck } from 'lucide-react'

interface QuickFixModalProps {
  isOpen: boolean
  onClose: () => void
  parameters: any
  onSave: (updated: any) => void
}

export function QuickFixModal({ isOpen, onClose, parameters, onSave }: QuickFixModalProps) {
  const [values, setValues] = useState<any>({})

  // Initialize values when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      const initial: any = {}
      Object.entries(parameters).forEach(([key, field]: [string, any]) => {
        if (field && typeof field === 'object' && 'value' in field) {
          initial[key] = field.value
        }
      })
      setValues(initial)
    }
    if (!open) onClose()
  }

  const handleSave = () => {
    const updated = { ...parameters }
    Object.entries(values).forEach(([key, val]) => {
      if (updated[key]) {
        updated[key] = {
          ...updated[key],
          value: val,
          confidence: 'manual_override'
        }
      }
    })
    onSave(updated)
    onClose()
  }

  const missingFields = Object.entries(parameters).filter(([_, v]: [any, any]) => v?.value === null)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white border border-slate-200 shadow-2xl sm:max-w-[600px] text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black uppercase tracking-tight flex items-center gap-3">
            <AlertCircle className="text-wolvio-orange" /> Exception Workbench
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Confirm or manually input critical parameters to enable precise billing validation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 space-y-6 max-h-[60vh] overflow-y-auto px-1 scrollbar-hide">
          {Object.entries(parameters).map(([key, field]: [string, any]) => {
            if (!field || typeof field !== 'object' || !('value' in field)) return null
            
            const isMissing = field.value === null
            const label = key.replace(/_/g, ' ').toUpperCase()

            return (
              <div key={key} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-wolvio-orange/30 transition-colors">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {label}
                  </Label>
                  {isMissing ? (
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">Missing</span>
                  ) : (
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">Detected</span>
                  )}
                </div>

                {/* Simplified input logic for demo — everything as text or number */}
                <div className="flex gap-4">
                  <Input 
                    type={typeof field.value === 'number' ? 'number' : 'text'}
                    value={values[key] ?? ''}
                    onChange={(e) => setValues({ ...values, [key]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                    className="bg-white border-slate-200 text-slate-900 font-mono focus:border-wolvio-orange/50 h-12"
                    placeholder="Enter value..."
                  />
                </div>
                
                {field.source_clause && (
                  <p className="text-[9px] text-slate-400 italic truncate">
                    &quot;{field.source_clause}&quot;
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <DialogFooter className="pt-6 border-t border-slate-100 gap-4">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-wolvio-orange hover:bg-[#d95a2b] text-white font-black text-xs uppercase tracking-widest px-8 rounded-xl h-12 shadow-lg"
          >
            Save & Continue <ShieldCheck className="ml-2 w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
