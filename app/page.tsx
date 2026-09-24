'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  CookingPot,
  Flower2,
  Home,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings2,
  ShoppingBasket,
  Sparkles,
  Utensils,
  Users,
  X,
} from 'lucide-react'

const people = [
  { name: 'Everyone', color: 'bg-[#d9c7a7]', text: 'text-[#493d2d]' },
  { name: 'Prashant', color: 'bg-[#b8d6ce]', text: 'text-[#294c47]' },
  { name: 'Aparna', color: 'bg-[#e6bfd0]', text: 'text-[#613c4b]' },
  { name: 'Shravani', color: 'bg-[#c8c5e7]', text: 'text-[#433f72]' },
]

const initialTasks = [
  { id: 1, title: "Load dishwasher", person: 'Shravani', time: 'Anytime', icon: Utensils, done: false, tone: 'mint' },
  { id: 2, title: 'Wash utensils', person: 'Prashant', time: 'By 9:00 pm', icon: Sparkles, done: false, tone: 'peach' },
  { id: 3, title: 'Laundry · washing', person: 'Prashant', time: '12:00 pm', icon: RefreshCw, done: false, tone: 'lavender' },
  { id: 4, title: 'Dust & vacuum', person: 'Prashant', time: 'This weekend', icon: Home, done: false, tone: 'sand' },
]

const weekDays = [
  { day: 'MON', date: '21', tasks: 3, meal: 'Rajma chawal' },
  { day: 'TUE', date: '22', tasks: 2, meal: 'Pasta primavera' },
  { day: 'WED', date: '23', tasks: 4, meal: 'Dal, rice & bhindi' },
  { day: 'THU', date: '24', tasks: 3, meal: 'Aloo paratha' },
  { day: 'FRI', date: '25', tasks: 2, meal: 'Takeaway night' },
  { day: 'SAT', date: '26', tasks: 4, meal: 'Chole & salad' },
  { day: 'SUN', date: '27', tasks: 2, meal: 'Roast vegetables' },
]

export default function Page() {
  const [activeNav, setActiveNav] = useState('Today')
  const [selectedPerson, setSelectedPerson] = useState('Everyone')
  const [tasks, setTasks] = useState(initialTasks)
  const [showAdd, setShowAdd] = useState(false)
  const [newChore, setNewChore] = useState('')

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks])
  const visibleTasks = selectedPerson === 'Everyone' ? tasks : tasks.filter((task) => task.person === selectedPerson)

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)))
  }

  function addChore() {
    const title = newChore.trim()
    if (!title) return
    setTasks((current) => [...current, { id: Date.now(), title, person: 'Prashant', time: 'Anytime', icon: ClipboardList, done: false, tone: 'mint' }])
    setNewChore('')
    setShowAdd(false)
    setSelectedPerson('Everyone')
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#27322f]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-[248px] shrink-0 border-r border-[#e5e3db] bg-[#fbfaf6] px-5 py-7 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#244c46] text-[#f4e4c8]"><Flower2 className="size-5" /></div>
            <div><div className="font-serif text-[20px] font-semibold tracking-[-0.02em]">GharKeChore</div><div className="text-[11px] text-[#87918a]">home, together</div></div>
          </div>
          <div className="mt-12 flex flex-col gap-2">
            {[
              { label: 'Today', icon: Home }, { label: 'This week', icon: CalendarDays }, { label: 'Meals', icon: CookingPot }, { label: 'Shopping', icon: ShoppingBasket }, { label: 'Changes', icon: RefreshCw },
            ].map(({ label, icon: Icon }) => <button key={label} onClick={() => setActiveNav(label)} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition ${activeNav === label ? 'bg-[#e8f0eb] font-semibold text-[#244c46]' : 'text-[#6f7973] hover:bg-[#f0efe8]'}`}><Icon className="size-[18px]" />{label}{label === 'Changes' && <span className="ml-auto rounded-full bg-[#e6bfd0] px-2 py-0.5 text-[10px] font-bold text-[#613c4b]">2</span>}</button>)}
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <button onClick={() => setActiveNav('Admin')} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm ${activeNav === 'Admin' ? 'bg-[#e8f0eb] font-semibold text-[#244c46]' : 'text-[#6f7973]'}`}><Settings2 className="size-[18px]" />Admin</button>
            <div className="mt-4 flex items-center gap-3 border-t border-[#e5e3db] px-2 pt-5"><div className="flex size-9 items-center justify-center rounded-full bg-[#b8d6ce] text-xs font-bold text-[#294c47]">P</div><div className="min-w-0"><div className="truncate text-sm font-semibold">Prashant</div><div className="text-xs text-[#87918a]">Admin</div></div><MoreHorizontal className="ml-auto size-4 text-[#87918a]" /></div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 pb-10 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between py-6 lg:py-8"><div className="flex items-center gap-3 lg:hidden"><button className="rounded-lg p-2 hover:bg-[#efeee7]" aria-label="Open menu"><Menu className="size-5" /></button><span className="font-serif text-xl font-semibold">GharKeChore</span></div><div className="hidden lg:block"><p className="text-sm font-medium text-[#87918a]">Wednesday, 23 September 2026</p><h1 className="mt-1 font-serif text-[32px] font-semibold tracking-[-0.03em]">Good morning, Prashant</h1></div><div className="flex items-center gap-2"><button className="relative rounded-xl p-2.5 text-[#6f7973] hover:bg-[#efeee7]" aria-label="Notifications"><Bell className="size-[19px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#c16b6b]" /></button><button className="flex items-center gap-2 rounded-xl border border-[#e5e3db] bg-white px-3 py-2 text-sm font-semibold shadow-sm"><div className="flex size-6 items-center justify-center rounded-full bg-[#b8d6ce] text-[10px] text-[#294c47]">P</div><span className="hidden sm:inline">Prashant</span><ChevronRight className="size-4 rotate-90 text-[#87918a]" /></button></div></header>

          <div className="mb-7 lg:hidden"><p className="text-sm font-medium text-[#87918a]">Wednesday, 23 September 2026</p><h1 className="mt-1 font-serif text-[29px] font-semibold tracking-[-0.03em]">Good morning, Prashant</h1></div>

          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">{people.map((person) => <button key={person.name} onClick={() => setSelectedPerson(person.name)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${selectedPerson === person.name ? 'border-[#244c46] bg-[#244c46] text-white' : 'border-[#e5e3db] bg-white text-[#6f7973] hover:border-[#b8d6ce]'}`}><span className={`size-2 rounded-full ${person.color}`} />{person.name}</button>)}</div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="flex flex-col gap-6">
              <section className="rounded-[24px] border border-[#e8e6de] bg-white p-5 shadow-[0_8px_30px_rgba(54,67,61,0.04)] sm:p-7"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><h2 className="font-serif text-[24px] font-semibold">Your chores</h2><span className="rounded-full bg-[#f2eee4] px-2 py-1 text-[11px] font-bold text-[#967d54]">{completed}/{tasks.length} done</span></div><p className="mt-1 text-sm text-[#87918a]">A little at a time makes a home.</p></div><button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-xl bg-[#edf3ef] px-3 py-2 text-xs font-bold text-[#244c46] hover:bg-[#e2eee7]"><Plus className="size-4" />Add</button></div><div className="mt-6 flex flex-col gap-2.5">{visibleTasks.map((task) => { const Icon = task.icon; return <div key={task.id} className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition sm:px-4 ${task.done ? 'border-[#e1eae4] bg-[#f7fbf8]' : 'border-[#eeeDE7] bg-[#fdfcf9]'}`}><button onClick={() => toggleTask(task.id)} className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition ${task.done ? 'border-[#5a9b8c] bg-[#5a9b8c] text-white' : 'border-[#d6ddd8] text-transparent hover:border-[#5a9b8c]'}`} aria-label={task.done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}><Check className="size-4" /></button><div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${task.tone === 'mint' ? 'bg-[#e3f0eb] text-[#4f8e80]' : task.tone === 'peach' ? 'bg-[#f8e9df] text-[#b6775a]' : task.tone === 'lavender' ? 'bg-[#eceafa] text-[#756fa8]' : 'bg-[#f3ecdc] text-[#a1834f]'}`}><Icon className="size-[17px]" /></div><div className="min-w-0 flex-1"><div className={`text-sm font-semibold ${task.done ? 'text-[#96a19b] line-through' : ''}`}>{task.title}</div><div className="mt-0.5 flex items-center gap-2 text-xs text-[#97a19b]"><span>{task.person}</span><span className="size-0.5 rounded-full bg-[#b5bdb7]" /><span>{task.time}</span></div></div>{!task.done && <button className="hidden rounded-lg p-2 text-[#a6afa9] hover:bg-[#edf3ef] hover:text-[#244c46] group-hover:block" aria-label={`Get help with ${task.title}`}><CircleHelp className="size-4" /></button>}</div> })}</div><button onClick={() => setActiveNav('This week')} className="mt-5 flex items-center gap-1 text-xs font-bold text-[#5a8177]">View all this week <ChevronRight className="size-3.5" /></button></section>

              <section className="rounded-[24px] border border-[#e8e6de] bg-[#f2eee4] p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#967d54]">This week</p><h2 className="mt-1 font-serif text-[24px] font-semibold">A week at a glance</h2></div><button className="rounded-lg p-1.5 text-[#967d54] hover:bg-[#e7dfcf]" aria-label="Open calendar"><CalendarDays className="size-[18px]" /></button></div><div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">{weekDays.map((item, index) => <button key={item.day} onClick={() => setActiveNav('This week')} className={`rounded-2xl border p-2 text-center transition sm:p-3 ${index === 2 ? 'border-[#244c46] bg-[#244c46] text-white shadow-md' : 'border-[#e3dccd] bg-[#f8f5ed] text-[#6f7973] hover:border-[#b8d6ce]'}`}><div className="text-[9px] font-bold tracking-wider opacity-70 sm:text-[10px]">{item.day}</div><div className="mt-1 text-lg font-semibold sm:text-xl">{item.date}</div><div className={`mx-auto mt-2 size-1.5 rounded-full ${index === 2 ? 'bg-[#f4e4c8]' : 'bg-[#b8d6ce]'}`} /></button>)}</div><div className="mt-5 flex items-center gap-3 border-t border-[#e1d8c8] pt-4"><div className="flex size-9 items-center justify-center rounded-xl bg-[#e7dfcf] text-[#967d54]"><Utensils className="size-4" /></div><div className="min-w-0"><p className="text-xs font-semibold text-[#967d54]">Tonight&apos;s dinner</p><p className="truncate text-sm font-semibold text-[#493d2d]">Dal, rice &amp; bhindi <span className="font-normal text-[#968c7b]">· Aparna</span></p></div><ChevronRight className="ml-auto size-4 text-[#aa9e8b]" /></div></section>
            </div>

            <div className="flex flex-col gap-6"><section className="rounded-[24px] border border-[#e8e6de] bg-[#244c46] p-6 text-white shadow-[0_12px_35px_rgba(36,76,70,0.13)]"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[#b8d6ce]"><Clock3 className="size-4" /><span className="text-xs font-bold uppercase tracking-[0.15em]">Next up</span></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[#d7e7df]">in 2 hours</span></div><h2 className="mt-5 font-serif text-[26px] font-semibold">Laundry · washing</h2><p className="mt-1 text-sm text-[#b8d6ce]">A calm reset for the weekend ahead.</p><div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4"><span className="text-xs text-[#b8d6ce]">Friday, 12:00 pm</span><button onClick={() => toggleTask(3)} className="rounded-xl bg-[#f4e4c8] px-3 py-2 text-xs font-bold text-[#493d2d] hover:bg-white">Done</button></div></section><section className="rounded-[24px] border border-[#e8e6de] bg-white p-6 shadow-[0_8px_30px_rgba(54,67,61,0.04)]"><div className="flex items-center justify-between"><div><h2 className="font-serif text-[23px] font-semibold">Meals today</h2><p className="mt-1 text-xs text-[#87918a]">Wednesday, 23 September</p></div><button onClick={() => setActiveNav('Meals')} className="text-xs font-bold text-[#5a8177]">Edit</button></div><div className="mt-5 flex flex-col gap-4"><MealRow label="Breakfast" meal="Up to the family" person="Unassigned" tone="bg-[#f3ecdc]" /><MealRow label="Lunch" meal="Leftover rajma" person="Aparna" tone="bg-[#f8e9df]" /><MealRow label="Dinner" meal="Dal, rice & bhindi" person="Aparna" tone="bg-[#e3f0eb]" /></div></section><section className="rounded-[24px] border border-[#e8e6de] bg-[#f8e9df] p-5"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/60 text-[#b6775a]"><ShoppingBasket className="size-4" /></div><div><p className="text-sm font-bold text-[#6b4839]">Shopping list</p><p className="mt-0.5 text-xs leading-relaxed text-[#8d6a5d]">5 items are still to pick up for this week.</p></div><ChevronRight className="ml-auto mt-1 size-4 text-[#b6775a]" /></div></section></div>
          </div>
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e3db] pt-5 text-xs text-[#97a19b]"><span>GharKeChore · London time</span><div className="flex gap-4"><button className="hover:text-[#244c46]">Need help</button><button className="hover:text-[#244c46]">Notification settings</button></div></footer>
        </section>
      </div>
      {showAdd && <div className="fixed inset-0 z-10 flex items-end justify-center bg-[#27322f]/20 p-4 sm:items-center"><div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Add a one-off chore</h2><button onClick={() => setShowAdd(false)} className="rounded-lg p-2 text-[#87918a] hover:bg-[#f2f3ed]" aria-label="Close"><X className="size-5" /></button></div><p className="mt-2 text-sm text-[#87918a]">This will be visible to the family and won&apos;t change recurring schedules.</p><div className="mt-6 flex flex-col gap-3"><input value={newChore} onChange={(event) => setNewChore(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) addChore() }} autoFocus className="h-12 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-4 text-sm outline-none focus:border-[#5a9b8c]" placeholder="What needs doing?" /><button onClick={addChore} disabled={!newChore.trim()} className="h-12 rounded-xl bg-[#244c46] text-sm font-bold text-white hover:bg-[#1c3d38] disabled:cursor-not-allowed disabled:opacity-50">Add chore</button></div></div></div>}
    </main>
  )
}

function MealRow({ label, meal, person, tone }: { label: string; meal: string; person: string; tone: string }) {
  return <div className="flex items-center gap-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Utensils className="size-4 text-[#6f7973]" /></div><div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wider text-[#a1aaa4]">{label}</p><p className="truncate text-sm font-semibold text-[#3f4b46]">{meal}</p></div><span className="text-right text-[11px] text-[#97a19b]">{person}</span></div>
}
