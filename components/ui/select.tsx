'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 
 * RE-IMPLEMENTATION: Native select for robustness in PoC without Radix
 */
interface SelectProps {
  value: string
  onValueChange: (val: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <div className="relative w-full">
      <select 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest text-white appearance-none focus:outline-none focus:ring-1 focus:ring-wolvio-orange transition-all cursor-pointer"
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}

export const SelectTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => <>{children}</>
export const SelectValue = ({ children, className }: { children?: React.ReactNode, className?: string }) => <>{children}</>
export const SelectContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <>{children}</>
export const SelectItem = ({ children, value, className }: { children: React.ReactNode, value: string, className?: string }) => (
  <option value={value} className="bg-[#0A101F] text-white py-2">
    {children}
  </option>
)
