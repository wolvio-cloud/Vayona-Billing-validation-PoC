'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      router.push('/')
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#061529] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[--color-wolvio-orange] opacity-10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 opacity-10 blur-[150px] rounded-full animate-pulse delay-700" />

      <div className="w-full max-w-[450px] z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="w-16 h-16 bg-[--color-wolvio-orange] rounded-[20px] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(242,102,48,0.4)]">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">Wolvio Analytics</h1>
          <p className="text-[--color-wolvio-mid] font-medium mt-2">Enterprise Contract Intelligence</p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[--color-wolvio-mid] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-wolvio-mid] group-focus-within:text-[--color-wolvio-orange] transition-colors" />
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="bg-white/5 border-white/10 focus:border-[--color-wolvio-orange] focus:ring-1 focus:ring-[--color-wolvio-orange] pl-11 py-6 rounded-[16px] text-white placeholder:text-white/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[--color-wolvio-mid] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-wolvio-mid] group-focus-within:text-[--color-wolvio-orange] transition-colors" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-white/5 border-white/10 focus:border-[--color-wolvio-orange] focus:ring-1 focus:ring-[--color-wolvio-orange] pl-11 py-6 rounded-[16px] text-white placeholder:text-white/20 transition-all"
                  required
                />
              </div>
            </div>

            <Button 
              disabled={loading}
              className="w-full bg-[--color-wolvio-orange] hover:bg-[#d95a2b] text-white py-8 rounded-[20px] text-lg font-bold shadow-[0_20px_40px_-10px_rgba(242,102,48,0.3)] transition-all group overflow-hidden"
            >
              <span className="flex items-center gap-2 group-hover:gap-4 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : 'Enter Platform'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </span>
            </Button>
          </form>

          <div className="mt-10 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-[--color-wolvio-mid]">
            <button className="hover:text-white transition-colors">Forgot Password?</button>
            <button className="hover:text-white transition-colors">Request Access</button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[--color-wolvio-mid]/40 text-[10px] mt-10 font-bold tracking-[0.2em] uppercase">
          SECURED BY WOLVIO QUANTUM GUARD • VERSION 2.5.0
        </p>
      </div>
    </div>
  )
}
