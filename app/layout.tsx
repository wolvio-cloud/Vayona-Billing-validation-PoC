import type { Metadata } from 'next'
import { Montserrat, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { DemoControlPanel } from '@/components/DemoControlPanel'
import { ConfidentialBanner } from '@/components/ConfidentialBanner'
import { ensureSeeded } from '@/lib/db/seed-check'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-heading',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensureSeeded()
  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
      <body className="bg-slate-50 text-slate-900 font-sans">
        <ConfidentialBanner />
        <main className="w-full relative overflow-visible">
          {children}
        </main>
        <DemoControlPanel />
      </body>
    </html>
  )
}
