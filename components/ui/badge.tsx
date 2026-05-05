import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[--color-primary] text-[--color-primary-foreground]',
        secondary: 'border-transparent bg-[--color-secondary] text-[--color-secondary-foreground]',
        destructive: 'border-transparent bg-[--color-destructive] text-[--color-destructive-foreground]',
        outline: 'text-[--color-foreground]',
        match: 'border-transparent bg-emerald-600 text-white',
        gap: 'border-transparent bg-red-600 text-white',
        opportunity: 'border-transparent bg-amber-600 text-white',
        insufficient: 'border-transparent bg-slate-400 text-white',
        demo: 'border-transparent bg-blue-600 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
