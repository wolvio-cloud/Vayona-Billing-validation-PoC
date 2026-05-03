import type { Metadata } from 'next'
import { Montserrat, Inter, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { DemoControlPanel } from '@/components/DemoControlPanel'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wolvio — Contract Execution Intelligence',
  description: 'Billing validation powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="bg-[--color-wolvio-dark] text-[--color-wolvio-light]">
        <header className="sticky top-0 z-50 w-full glass border-b border-white/5 px-8 py-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[--color-wolvio-orange] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(242,102,48,0.4)]">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <h1 className="font-heading font-bold text-sm tracking-widest uppercase opacity-70">Contract Intelligence</h1>
          </div>
          <Link href="/" className="font-heading font-extrabold text-2xl tracking-tighter text-[--color-wolvio-orange] hover:scale-105 transition-transform">
            Wolvio
          </Link>
        </header>
        <main className="w-full relative overflow-visible">
          {children}
        </main>
        <DemoControlPanel />
      </body>
    </html>
  )

}
