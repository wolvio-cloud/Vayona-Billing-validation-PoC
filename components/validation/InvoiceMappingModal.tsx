'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle2, ListFilter } from 'lucide-react'
import { Invoice, InvoiceLineItem } from '@/lib/schemas/invoice'
import { formatINR } from '@/lib/utils'

interface InvoiceMappingModalProps {
  isOpen: boolean
  onClose: () => void
  rawInvoice: any
  onMappingComplete: (mapped: Invoice) => void
}

const CATEGORIES = ['BaseFee', 'Escalation', 'Variable', 'LD', 'Bonus', 'Other']

export function InvoiceMappingModal({ isOpen, onClose, rawInvoice, onMappingComplete }: InvoiceMappingModalProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])
  
  useEffect(() => {
    if (isOpen && rawInvoice?.line_items) {
      setLineItems(rawInvoice.line_items.map((li: any, idx: number) => ({
        item_id: li.item_id || `LI-${idx+1}`,
        description: li.description || 'Unknown Item',
        category: CATEGORIES.includes(li.category) ? li.category : 'Other',
        quantity: typeof li.quantity === 'number' ? li.quantity : 1,
        unit: li.unit || 'Unit',
        unit_rate: typeof li.unit_rate === 'number' ? li.unit_rate : (li.amount || 0),
        amount: typeof li.amount === 'number' ? li.amount : 0
      })))
    }
  }, [isOpen, rawInvoice?.line_items])

  const handleCategoryChange = (itemId: string, category: string) => {
    setLineItems(prev => prev.map(item => 
      item.item_id === itemId ? { ...item, category: category as any } : item
    ))
  }

  const handleSave = () => {
    const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)
    const gstAmount = Math.round(subtotal * 0.18)
    
    // Save mapping template if we have a counterparty context
    if (rawInvoice?.counterparty || rawInvoice?.contract_id) {
      const key = `mapping_template_${rawInvoice?.counterparty || rawInvoice?.contract_id}`
      const template = lineItems.reduce((acc: any, item) => {
        acc[item.description] = item.category
        return acc
      }, {})
      localStorage.setItem(key, JSON.stringify(template))
    }

    const mapped: Invoice = {
      ...rawInvoice,
      line_items: lineItems,
      subtotal,
      gst_rate: rawInvoice?.gst_rate || 18,
      gst_amount: rawInvoice?.gst_amount || gstAmount,
      total: rawInvoice?.total || (subtotal + gstAmount),
      status: 'Pending'
    }
    onMappingComplete(mapped)
    onClose()
  }

  // Effect to load templates
  useEffect(() => {
    if (isOpen && lineItems.length > 0 && (rawInvoice?.counterparty || rawInvoice?.contract_id)) {
      const key = `mapping_template_${rawInvoice?.counterparty || rawInvoice?.contract_id}`
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          const template = JSON.parse(stored)
          setLineItems(prev => prev.map(item => ({
            ...item,
            category: template[item.description] || item.category
          })))
        } catch (e) { /* ignore */ }
      }
    }
  }, [isOpen, rawInvoice?.counterparty, rawInvoice?.contract_id, lineItems.length])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white border border-slate-200 shadow-2xl sm:max-w-[800px] text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black uppercase tracking-tight flex items-center gap-3">
            <ListFilter className="text-wolvio-orange" /> Smart Mapping Workbench
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            {rawInvoice?.counterparty ? `Source: ${rawInvoice.counterparty} | Learning active` : 'Categorize line items to ensure audit accuracy.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4 max-h-[60vh] overflow-y-auto px-1 scrollbar-hide">
          <div className="grid grid-cols-[1fr,120px,180px] gap-4 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 border-b border-slate-100">
            <div>Line Item Description</div>
            <div className="text-right">Amount</div>
            <div>Category Mapping</div>
          </div>
          
          {lineItems.map((item) => (
            <div key={item.item_id} className="grid grid-cols-[1fr,120px,180px] gap-4 items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 leading-snug">{item.description}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">{item.quantity} {item.unit} @ {formatINR(item.unit_rate)}</p>
              </div>
              <div className="text-right font-mono text-sm font-bold text-slate-900">
                {formatINR(item.amount)}
              </div>
              <Select 
                value={item.category} 
                onValueChange={(val) => handleCategoryChange(item.item_id, val)}
              >
                <SelectTrigger className="bg-white border-slate-200 text-[10px] font-black uppercase h-10 focus:ring-1 focus:ring-wolvio-orange/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-[10px] font-black uppercase tracking-widest focus:bg-wolvio-orange focus:text-white">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-6 border-t border-slate-100 gap-4">
          <div className="flex-1 flex items-center gap-3 text-amber-600">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Calculations will auto-update</span>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-wolvio-orange hover:bg-[#d95a2b] text-white font-black text-xs uppercase tracking-widest px-8 rounded-xl h-12 shadow-lg"
          >
            Apply Mapping <CheckCircle2 className="ml-2 w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
