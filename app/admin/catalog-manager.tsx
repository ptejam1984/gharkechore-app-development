'use client'

import { useState, useTransition } from 'react'
import { addCatalogTask } from '@/app/actions'

export default function CatalogManager({ initialCategories }: { initialCategories: Record<string, string[]> }) {
  const [categories, setCategories] = useState(initialCategories)
  const [category, setCategory] = useState('')
  const [task, setTask] = useState('')
  const [pending, startTransition] = useTransition()

  function addTask() {
    const cleanCategory = category.trim() || 'General'
    const cleanTask = task.trim()
    if (!cleanTask) return
    startTransition(async () => {
      await addCatalogTask(cleanCategory, cleanTask)
      setCategories((current) => ({ ...current, [cleanCategory]: [...(current[cleanCategory] ?? []), cleanTask] }))
      setTask('')
    })
  }

  return (
    <section className="mt-6 rounded-[24px] border border-[#e8e6de] bg-white p-6 shadow-[0_8px_30px_rgba(54,67,61,0.04)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#87918a]">Task picker library</p><h2 className="mt-1 font-serif text-2xl font-semibold">Categories & tasks</h2><p className="mt-1 text-sm text-[#6f7973]">Add reusable options for the family task picker.</p></div>
        <div className="flex flex-wrap gap-2">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="h-10 w-32 rounded-xl border border-[#e2e5df] px-3 text-sm outline-none focus:border-[#5a9b8c]" />
          <input value={task} onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Task name" className="h-10 w-40 rounded-xl border border-[#e2e5df] px-3 text-sm outline-none focus:border-[#5a9b8c]" />
          <button type="button" onClick={addTask} disabled={pending || !task.trim()} className="h-10 rounded-xl bg-[#244c46] px-4 text-sm font-bold text-white disabled:opacity-50">Add task</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(categories).map(([name, tasks]) => <div key={name} className="rounded-2xl bg-[#fbfaf6] p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-[#34423c]">{name}</h3><span className="text-xs font-bold text-[#87918a]">{tasks.length}</span></div><div className="mt-3 flex flex-wrap gap-1.5">{tasks.map((item) => <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs text-[#6f7973]">{item}</span>)}</div></div>)}
      </div>
    </section>
  )
}
