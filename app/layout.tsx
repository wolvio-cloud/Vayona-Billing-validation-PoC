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
        <main className="w-full relative overflow-visible">
          {children}
        </main>
        <DemoControlPanel />
      </body>
    </html>
  )
}
