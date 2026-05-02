export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[--color-border] bg-[--color-wolvio-navy] text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="font-bold text-lg tracking-tight text-[--color-wolvio-orange]">WOLVIO</span>
          <span className="text-sm text-white/70">Contract Execution Intelligence</span>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  )
}
