'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DemoModeBadge } from '@/components/DemoModeBadge'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Premium Light Glass Header */}
      <header className="sticky top-0 z-[100] w-full bg-white border-b border-slate-200 px-6 md:px-12 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="group flex items-center gap-4">
            <div className="w-36 h-14 px-5 bg-slate-900 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
          <div className="hidden lg:block h-6 w-[1px] bg-slate-200" />
          <h2 className="hidden lg:block font-heading font-bold text-xs tracking-[0.3em] uppercase text-slate-400">
            Contract Intelligence Platform
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {!isDashboard && (
            <Link 
              href="/dashboard" 
              className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
          )}
          <DemoModeBadge />
          <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer group">
            <div className="w-2 h-2 rounded-full bg-wolvio-orange group-hover:scale-150 transition-transform" />
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
