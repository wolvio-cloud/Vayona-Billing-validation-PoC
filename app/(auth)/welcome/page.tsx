'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileSearch, Zap, ShieldCheck, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.05),transparent)]" />
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-orange-500 opacity-5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-blue-500 opacity-5 blur-[150px] rounded-full" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        <div className="max-w-[1000px] w-full text-center space-y-16">
          
          {/* Status Badge */}
          <div className="flex justify-center animate-in fade-in slide-in-from-top-8 duration-1000">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white border border-slate-200 text-wolvio-orange text-[10px] md:text-xs font-black tracking-[0.4em] uppercase shadow-sm">
              <Zap size={14} className="fill-wolvio-orange" /> Platform Initialized
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-8 animate-in fade-in slide-in-from-top-12 duration-1000 delay-200">
            <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tight leading-[1.1] text-slate-900">
              Stop Revenue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-wolvio-orange to-amber-500">Leakage.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Enterprise Contract Intelligence & Billing Validation. <br /> 
              Extract, Audit, and Recover with high-precision AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            {[
              { icon: FileSearch, title: 'Contract X-Ray', desc: 'Auto-extract commercial terms from complex 100+ page PDFs.' },
              { icon: Zap, title: 'Live Validation', desc: 'Audit invoices in real-time against specific contract clauses.' },
              { icon: ShieldCheck, title: 'Revenue Guard', desc: 'Identify Gaps & Opportunities instantly before payment.' }
            ].map((item, idx) => (
              <div key={idx} className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm hover:border-wolvio-orange/30 transition-all group text-left">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-orange-100">
                  <item.icon className="text-wolvio-orange" size={20} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-8 animate-in fade-in zoom-in duration-1000 delay-700">
            <Button 
              onClick={() => router.push('/login')}
              className="bg-wolvio-orange hover:bg-[#d95a2b] text-white px-16 py-8 rounded-[28px] text-2xl font-black shadow-xl shadow-orange-500/20 group transition-all"
            >
              Get Started <ArrowRight className="ml-4 group-hover:translate-x-3 transition-transform" size={24} />
            </Button>
          </div>
        </div>
      </div>

      {/* Persistent Footer */}
      <div className="w-full py-12 flex justify-center z-10">
        <div className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase border-t border-slate-200 pt-8 w-[200px] text-center">
          Enterprise • April 2024
        </div>
      </div>
    </div>
  )
}
