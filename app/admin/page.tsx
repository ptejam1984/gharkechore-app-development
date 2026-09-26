import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CatalogManager from './catalog-manager'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/')

  const [{ data: members }, { data: templates }, { data: occurrences }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, role, visual_only, created_at').order('created_at'),
    supabase.from('chore_templates').select('id, title, category, frequency, active, configuration_complete').order('created_at'),
    supabase
      .from('chore_occurrences')
      .select('id, occurrence_date, status, assigned_to, template:chore_templates(title), assignee:profiles!chore_occurrences_assigned_to_fkey(display_name)')
      .order('occurrence_date', { ascending: false })
      .limit(50),
  ])

  const pickerCategories: Record<string, string[]> = {
    Kitchen: ['Wash Utensils', 'Load Dishwasher', 'Unload Dishwasher', 'Clean Kitchen', 'Clean Fridge', 'Wipe Counters'],
    Laundry: ['Wash Clothes', 'Dry Clothes', 'Fold Clothes', 'Iron Clothes', 'Put Clothes Away', 'Change Bedsheets'],
    Cleaning: ['Vacuum', 'Sweep Floor', 'Mop Floor', 'Dust Surfaces', 'Clean Bathroom', 'Clean Windows', 'Tidy Room'],
    Meals: ['Make Breakfast', 'Cook Lunch', 'Cook Dinner', 'Prepare Snacks', 'Pack Lunch', 'Plan Meals', 'Set Table', 'Clear Table'],
    Shopping: ['Buy Groceries', 'Buy Essentials', 'Collect Order', 'Return Item'],
    'Bins & Garden': ['Take Bins Out', 'Bring Bins In', 'Empty Bins', 'Sort Recycling', 'Mow Lawn', 'Water Plants'],
    'Study & Work': ['Study', 'Do Homework', 'Read', 'Revise', 'Practise Skill', 'Pack School Bag'],
    Family: ['School Drop-off', 'School Pick-up', 'Help Family'],
    'Personal & Admin': ['Exercise', 'Book Appointment', 'Pay Bill', 'Collect Prescription', 'Fix Something'],
  }
  const storedByKey = new Map((templates ?? []).map((template: any) => [`${template.category ?? 'General'}::${template.title}`, { id: template.id, title: template.title }]))
  const catalog = Object.fromEntries(Object.entries(pickerCategories).map(([category, titles]) => [category, titles.map((title) => storedByKey.get(`${category}::${title}`) ?? { id: '', title })]))

  return (
    <main className="min-h-screen bg-[#f8f7f2] px-5 py-8 text-[#27322f] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#87918a]">GharKeChore · administration</p>
            <h1 className="mt-1 font-serif text-4xl font-semibold tracking-[-0.03em]">Admin centre</h1>
            <p className="mt-2 text-sm text-[#6f7973]">Manage family members, the task picker library, and completion records.</p>
          </div>
          <Link href="/" className="rounded-xl border border-[#e5e3db] bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:border-[#b8d6ce]">Back to dashboard</Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[24px] border border-[#e8e6de] bg-white p-6 shadow-[0_8px_30px_rgba(54,67,61,0.04)]">
            <div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Family members</h2><span className="rounded-full bg-[#e8f0eb] px-3 py-1 text-xs font-bold text-[#244c46]">{members?.length ?? 0}</span></div>
            <div className="mt-5 flex flex-col gap-3">
              {(members ?? []).map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl bg-[#fbfaf6] px-4 py-3">
                  <div><p className="font-semibold">{member.display_name}</p><p className="text-xs text-[#87918a]">{member.visual_only ? 'Visual only' : 'Can complete chores'}</p></div>
                  <span className="rounded-full bg-[#f2eee4] px-2.5 py-1 text-xs font-bold capitalize text-[#967d54]">{member.role}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        <CatalogManager initialCategories={catalog} />

        <section className="mt-6 rounded-[24px] border border-[#e8e6de] bg-white p-6 shadow-[0_8px_30px_rgba(54,67,61,0.04)]">
          <div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Recent chore status</h2><span className="text-sm text-[#87918a]">Last 50 occurrences</span></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#e8e6de] text-xs uppercase tracking-wider text-[#87918a]"><tr><th className="pb-3">Chore</th><th className="pb-3">Assigned to</th><th className="pb-3">Date</th><th className="pb-3">Status</th></tr></thead><tbody>{(occurrences ?? []).map((occurrence: any) => <tr key={occurrence.id} className="border-b border-[#f0efe8]"><td className="py-3 font-semibold">{occurrence.template?.title ?? 'Chore'}</td><td className="py-3">{occurrence.assignee?.display_name ?? 'Unassigned'}</td><td className="py-3 text-[#6f7973]">{occurrence.occurrence_date}</td><td className="py-3"><span className="rounded-full bg-[#e8f0eb] px-2.5 py-1 text-xs font-bold capitalize text-[#244c46]">{occurrence.status.replace('_', ' ')}</span></td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  )
}
