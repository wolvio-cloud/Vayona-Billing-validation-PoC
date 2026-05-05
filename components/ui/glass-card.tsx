import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'orange' | 'blue' | 'muted'
  hover?: boolean
}

export function GlassCard({ children, className, variant = 'default', hover = false }: GlassCardProps) {
  const variants = {
    default: 'bg-white border-slate-200 shadow-sm',
    orange: 'bg-orange-50 border-orange-200 shadow-sm',
    blue: 'bg-blue-50 border-blue-200 shadow-sm',
    muted: 'bg-slate-50 border-slate-100 opacity-60'
  }

  return (
    <div className={cn(
      'rounded-[32px] border transition-all duration-500 overflow-hidden',
      variants[variant],
      hover && 'hover:scale-[1.01] hover:border-slate-300 hover:shadow-md',
      className
    )}>
      {children}
    </div>
  )
}
