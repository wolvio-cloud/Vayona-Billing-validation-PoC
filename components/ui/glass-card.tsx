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
    default: 'bg-white/5 border-white/10',
    orange: 'bg-wolvio-orange/10 border-wolvio-orange/20 shadow-[0_20px_40px_-15px_rgba(242,102,48,0.2)]',
    blue: 'bg-blue-500/10 border-blue-500/20 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)]',
    muted: 'bg-white/[0.02] border-white/5 opacity-60'
  }

  return (
    <div className={cn(
      'rounded-[32px] border backdrop-blur-xl transition-all duration-500 overflow-hidden',
      variants[variant],
      hover && 'hover:scale-[1.01] hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]',
      className
    )}>
      {children}
    </div>
  )
}
