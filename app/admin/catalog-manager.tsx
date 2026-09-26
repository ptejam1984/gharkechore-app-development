'use client'

import { useState, useTransition } from 'react'
import { addCatalogTask, updateCatalogTask } from '@/app/actions'

type Catalog = Record<string, Array<{ id: string; title: string }>>

export default function CatalogManager({ initialCategories }: { initialCategories: Catalog }) {
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [newTask, setNewTask] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [pending, startTransition] = useTransition()

  function saveTask(id: string) {
    const title = editingTitle.trim()
    const category = selectedCategory
    if (!title || !category) return
    startTransition(async () => {
      if (id) await updateCatalogTask(id, title)
      else await addCatalogTask(category, title)
      setCategories((current) => Object.fromEntries(Object.entries(current).map(([name, tasks]) => [name, tasks.map((task) => task.id === id ? { ...task, title } : task)])))
      setEditingId(null)
    })
  }

  function addTask() {
    const category = selectedCategory
    const title = newTask.trim()
    if (!category || !title) return
    startTransition(async () => {
      await addCatalogTask(category, title)
      setCategories((current) => ({ ...current, [category]: [...(current[category] ?? []), { id: `new-${Date.now()}`, title }] }))
      setNewTask('')
    })
  }

  function addCategory() {
    const category = newCategory.trim()
    if (!category || categories[category]) return
    setCategories((current) => ({ ...current, [category]: [] }))
    setSelectedCategory(category)
    setNewCategory('')
  }

  const tasks = selectedCategory ? categories[selectedCategory] ?? [] : []

  return (
    <section className="mt-6 rounded-[24px] border border-border bg-white p-6 shadow-[0_8px_30px_rgba(54,67,61,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Task picker library</p><h2 className="mt-1 font-serif text-2xl font-semibold">Categories & tasks</h2><p className="mt-1 text-sm text-muted-foreground">Select a category to manage its reusable tasks.</p></div>
        <div className="flex gap-2"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} placeholder="New category" className="h-10 rounded-xl border border-input px-3 text-sm outline-none focus:border-success" /><button type="button" onClick={addCategory} disabled={!newCategory.trim()} className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50">Add category</button></div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-sidebar text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Category</th><th className="px-4 py-3">Tasks</th></tr></thead><tbody>{Object.entries(categories).map(([category, categoryTasks]) => <tr key={category} className="border-t border-muted"><td className="px-4 py-3"><button type="button" onClick={() => setSelectedCategory(category)} className="font-semibold text-mint underline decoration-mint underline-offset-4 hover:text-primary">{category}</button></td><td className="px-4 py-3 text-muted-foreground">{categoryTasks.length}</td></tr>)}</tbody></table></div>

      {selectedCategory && <div className="mt-5 rounded-2xl bg-sidebar p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</p><h3 className="mt-1 text-lg font-semibold">{selectedCategory}</h3></div><button type="button" onClick={() => setSelectedCategory(null)} className="text-sm font-semibold text-muted-foreground">Close</button></div><div className="mt-4 flex flex-col gap-2">{tasks.map((task) => <div key={task.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2"><input value={editingId === task.id ? editingTitle : task.title} readOnly={editingId !== task.id} onChange={(e) => setEditingTitle(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{editingId === task.id ? <button type="button" onClick={() => saveTask(task.id)} disabled={pending} className="text-xs font-bold text-mint">Save</button> : <button type="button" onClick={() => { setEditingId(task.id); setEditingTitle(task.title) }} className="text-xs font-bold text-muted-foreground">Edit</button>}</div>)}</div><div className="mt-4 flex gap-2"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder={`Add task to ${selectedCategory}`} className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-success" /><button type="button" onClick={addTask} disabled={pending || !newTask.trim()} className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50">Add task</button></div></div>}
    </section>
  )
}
