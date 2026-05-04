'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DemoModeBadge } from '@/components/DemoModeBadge'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  return (
    <div className="min-h-screen flex flex-col bg-[--color-wolvio-dark]">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-[100] w-full glass border-b border-white/5 px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="group flex items-center gap-4">
            <div className="w-10 h-10 bg-[--color-wolvio-orange] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(242,102,48,0.4)] transition-transform group-hover:scale-110">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="font-heading font-black text-2xl tracking-tighter text-white group-hover:text-[--color-wolvio-orange] transition-colors">
              Wolvio
            </span>
          </Link>
          <div className="hidden lg:block h-6 w-[1px] bg-white/10" />
          <h2 className="hidden lg:block font-heading font-bold text-xs tracking-[0.3em] uppercase text-[--color-wolvio-mid]">
            Contract Intelligence Platform
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {!isDashboard && (
            <Link 
              href="/dashboard" 
              className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[--color-wolvio-mid] hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
          )}
          <DemoModeBadge />
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="w-2 h-2 rounded-full bg-[--color-wolvio-orange] group-hover:scale-150 transition-transform" />
          </div>
        </div>
      </header>

      {/* Optimized Content Container */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-12 py-12 relative">
        {children}
      </main>

      {/* Subtle Bottom Glow */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-blue-600/5 blur-[120px] pointer-events-none -z-10" />
    </div>
  )
}
