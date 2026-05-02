import type { Metadata } from 'next'
import { Montserrat, Inter, JetBrains_Mono } from 'next/font/google'
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
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[--color-wolvio-off]">
        <header className="w-full bg-[--color-wolvio-navy] text-white px-8 py-4 flex items-center justify-between shadow-sm">
          <h1 className="font-heading font-semibold text-lg tracking-wide text-[--color-wolvio-light]">Contract Execution Intelligence</h1>
          <div className="font-heading font-extrabold text-2xl tracking-tighter text-[--color-wolvio-orange]">Wolvio</div>
        </header>
        <main className="flex-1 w-full">
          {children}
        </main>
        <DemoControlPanel />
      </body>
    </html>
  )
}
