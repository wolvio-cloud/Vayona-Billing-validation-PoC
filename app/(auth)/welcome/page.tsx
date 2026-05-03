'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileSearch, Zap, ShieldCheck, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#030A14] text-white flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0b1e3b,transparent)]" />
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[--color-wolvio-orange] opacity-5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-blue-600 opacity-5 blur-[150px] rounded-full" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        <div className="max-w-[1000px] w-full text-center space-y-16">
          
          {/* Status Badge */}
          <div className="flex justify-center animate-in fade-in slide-in-from-top-8 duration-1000">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-[--color-wolvio-orange] text-[10px] md:text-xs font-black tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(242,102,48,0.1)]">
              <Zap size={14} className="fill-[--color-wolvio-orange]" /> Platform Initialized
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-8 animate-in fade-in slide-in-from-top-12 duration-1000 delay-200">
            <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tight leading-[1.1] text-white">
              Stop Revenue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[--color-wolvio-orange] to-[#ffd700]">Leakage.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[--color-wolvio-mid] max-w-2xl mx-auto font-medium leading-relaxed">
              Enterprise Contract Intelligence & Billing Validation. <br /> 
              Extract, Audit, and Recover with high-precision AI.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            {[
              { icon: FileSearch, title: 'Contract X-Ray', desc: 'Auto-extract commercial terms from complex 100+ page PDFs.' },
              { icon: Zap, title: 'Live Validation', desc: 'Audit invoices in real-time against specific contract clauses.' },
              { icon: ShieldCheck, title: 'Revenue Guard', desc: 'Identify Gaps & Opportunities instantly before payment.' }
            ].map((item, idx) => (
              <div key={idx} className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/10 transition-all group text-left">
                <div className="w-12 h-12 bg-[--color-wolvio-orange]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-[--color-wolvio-orange]/20">
                  <item.icon className="text-[--color-wolvio-orange]" size={20} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white tracking-tight">{item.title}</h3>
                <p className="text-[--color-wolvio-mid] text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-8 animate-in fade-in zoom-in duration-1000 delay-700">
            <Button 
              onClick={() => router.push('/login')}
              className="bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white px-16 py-8 rounded-[28px] text-2xl font-black shadow-[0_20px_80px_-20px_rgba(242,102,48,0.5)] group transition-all"
            >
              Get Started <ArrowRight className="ml-4 group-hover:translate-x-3 transition-transform" size={24} />
            </Button>
          </div>
        </div>
      </div>

      {/* Persistent Footer */}
      <div className="w-full py-12 flex justify-center z-10 bg-gradient-to-t from-black/20 to-transparent">
        <div className="text-[10px] font-black text-[--color-wolvio-mid]/40 tracking-[0.4em] uppercase border-t border-white/5 pt-8 w-[200px] text-center">
          Enterprise • April 2024
        </div>
      </div>
    </div>
  )
}
