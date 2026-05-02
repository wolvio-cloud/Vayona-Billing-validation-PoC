import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { DemoControlPanel } from '@/components/DemoControlPanel'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wolvio — Contract Execution Intelligence',
  description: 'Billing validation powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[--color-off]">
        {children}
        <DemoControlPanel />
      </body>
    </html>
  )
}
