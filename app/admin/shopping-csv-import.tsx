'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload } from 'lucide-react'
import { importShoppingCsv } from '../actions'

export default function ShoppingCsvImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)
    setMessage(null)

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      startTransition(async () => {
        try {
          await importShoppingCsv(text)
          setMessage(`Imported items from "${file.name}". Family members can now bring them into their shopping list.`)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unable to import that CSV file.')
        }
      })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <section className="mt-6 rounded-[24px] border border-border bg-white p-6 shadow-[0_8px_30px_rgba(54,67,61,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Shopping list import</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Upload a CSV with one item per line (optionally &quot;item, quantity&quot;). Family members will see an
            import link on their shopping list.
          </p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Upload className="size-[18px]" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Importing…' : 'Upload CSV'}
        </button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      </div>
      {message && <p className="mt-4 rounded-lg bg-success/15 px-3 py-2 text-sm text-success">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p>}
    </section>
  )
}
