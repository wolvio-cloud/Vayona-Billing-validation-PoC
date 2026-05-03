'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileSearch, Zap, ShieldCheck, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#061529] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#061529] via-[#0b1e3b] to-[#061529]" />
      
      {/* Mesh Gradients */}
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[--color-wolvio-orange] opacity-5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-blue-600 opacity-5 blur-[150px] rounded-full" />

      <div className="max-w-[900px] w-full z-10 text-center space-y-12">
        <div className="space-y-4 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[--color-wolvio-orange] text-xs font-bold tracking-[0.2em] uppercase mb-4">
            <Zap size={14} className="animate-pulse" /> Platform Initialized
          </div>
          <h1 className="text-6xl md:text-8xl font-heading font-extrabold tracking-tight leading-tight">
            Stop Revenue <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[--color-wolvio-orange] to-[#ffd700]">Leakage.</span>
          </h1>
          <p className="text-xl md:text-2xl text-[--color-wolvio-mid] max-w-2xl mx-auto font-medium leading-relaxed">
            Enterprise Contract Intelligence & Billing Validation. <br /> 
            Extract, Audit, and Recover with high-precision AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          {[
            { icon: FileSearch, title: 'Contract X-Ray', desc: 'Auto-extract commercial terms from complex 100+ page PDFs.' },
            { icon: Zap, title: 'Live Validation', desc: 'Audit invoices in real-time against specific contract clauses.' },
            { icon: ShieldCheck, title: 'Revenue Guard', desc: 'Identify Gaps & Opportunities instantly before payment.' }
          ].map((item, idx) => (
            <div key={idx} className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-[--color-wolvio-orange]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <item.icon className="text-[--color-wolvio-orange]" />
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-[--color-wolvio-mid] text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-8 animate-in fade-in zoom-in duration-1000 delay-700">
          <Button 
            onClick={() => router.push('/login')}
            className="bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white px-12 py-8 rounded-[24px] text-xl font-bold shadow-[0_20px_60px_-15px_rgba(242,102,48,0.4)] group transition-all"
          >
            Get Started <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </div>

      <div className="absolute bottom-10 text-[10px] font-bold text-[--color-wolvio-mid]/30 tracking-widest uppercase">
        Built for Enterprise Sales Meeting • April 2024
      </div>
    </div>
  )
}
