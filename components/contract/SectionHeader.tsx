'use client'

import { Separator } from '@/components/ui/separator'

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mt-12 mb-6">
      <h3 className="font-heading font-bold text-lg text-[--color-wolvio-light] whitespace-nowrap">{title}</h3>
      <Separator className="flex-1 bg-wolvio-slate" />
    </div>
  )
}
