'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // 1. Set the mock authentication cookie that proxy.ts/middleware looks for
    document.cookie = "wolvio-auth=true; path=/; max-age=3600; SameSite=Lax"
    
    // 2. Redirect to the new dedicated dashboard path
    // We use a small delay to ensure the cookie is processed by the browser
    setTimeout(() => {
      router.push('/dashboard')
    }, 100)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500 opacity-5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500 opacity-5 blur-[150px] rounded-full animate-pulse delay-700" />

      <div className="w-full max-w-[450px] z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="w-16 h-16 bg-wolvio-orange rounded-[20px] flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight">Wolvio Analytics</h1>
          <p className="text-slate-400 font-medium mt-2">Enterprise Contract Intelligence</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-wolvio-orange transition-colors" />
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="bg-slate-50 border-slate-200 focus:border-wolvio-orange focus:ring-1 focus:ring-wolvio-orange pl-11 py-6 rounded-[16px] text-slate-900 placeholder:text-slate-300 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-wolvio-orange transition-colors" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-slate-50 border-slate-200 focus:border-wolvio-orange focus:ring-1 focus:ring-wolvio-orange pl-11 py-6 rounded-[16px] text-slate-900 placeholder:text-slate-300 transition-all"
                  required
                />
              </div>
            </div>

            <Button 
              disabled={loading}
              className="w-full bg-wolvio-orange hover:bg-[#d95a2b] text-white py-8 rounded-[20px] text-lg font-bold shadow-[0_20px_40px_-10px_rgba(242,102,48,0.3)] transition-all group overflow-hidden"
            >
              <span className="flex items-center gap-2 group-hover:gap-4 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : 'Enter Platform'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </span>
            </Button>
          </form>

          <div className="mt-10 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
            <button className="hover:text-slate-900 transition-colors">Forgot Password?</button>
            <button className="hover:text-slate-900 transition-colors">Request Access</button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-300 text-[10px] pb-10 mt-10 font-bold tracking-[0.2em] uppercase">
          SECURED BY WOLVIO QUANTUM GUARD • VERSION 2.5.0
        </p>
      </div>
    </div>
  )
}
