export default async function ValidatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[--color-wolvio-navy]">Validate: {id}</h1>
      <p className="text-[--color-muted-foreground]">Validation report — wired in Phase 4 after engine is complete.</p>
    </div>
  )
}
