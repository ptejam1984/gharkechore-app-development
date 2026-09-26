import { Flower2 } from 'lucide-react'

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
    <main className="flex min-h-screen items-center justify-center bg-[#f8f7f2] px-5 py-10 text-[#27322f]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[14px] bg-[#244c46] text-[#f4e4c8]">
            <Flower2 className="size-5" />
          </div>
          <div>
            <div className="font-serif text-[22px] font-semibold tracking-[-0.02em]">GharKeChore</div>
            <div className="text-[11px] text-[#87918a]">home, together</div>
          </div>
        </div>
        <div className="rounded-[24px] border border-[#e8e6de] bg-white p-7 shadow-[0_8px_30px_rgba(54,67,61,0.05)]">
          <h1 className="font-serif text-[28px] font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-[#87918a]">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  )
}
