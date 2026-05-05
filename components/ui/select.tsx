'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 
 * Native select implementation — light mode optimized
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
        className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-wolvio-orange/30 focus:border-wolvio-orange/50 transition-all cursor-pointer shadow-sm hover:border-slate-300"
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}

export const SelectTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => <>{children}</>
export const SelectValue = ({ children, className }: { children?: React.ReactNode, className?: string }) => <>{children}</>
export const SelectContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <>{children}</>
export const SelectItem = ({ children, value, className }: { children: React.ReactNode, value: string, className?: string }) => (
  <option value={value} className="bg-white text-slate-900 py-2">
    {children}
  </option>
)
