export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[--color-wolvio-navy]">Contract: {id}</h1>
      <p className="text-[--color-muted-foreground]">Contract detail — wired in Phase 3 after extraction engine.</p>
    </div>
  )
}
