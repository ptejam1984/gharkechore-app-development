export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5"><img src="/gharke-chore-brand.png" alt="GharKeChore" className="size-10 rounded-xl" /><div className="font-serif text-[22px] font-semibold tracking-[-0.02em]">GharKeChore</div></div>
            <div className="text-[13px] text-muted-foreground">Kaam karo, kaamchori nahi.</div>
          </div>
        </div>
        <div className="rounded-[24px] border border-border bg-card p-7 shadow-[0_8px_30px_rgba(54,67,61,0.05)]">
          <h1 className="font-serif text-[28px] font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  )
}
