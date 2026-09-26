'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  CookingPot,
  Home,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Settings2,
  ShoppingBasket,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import type { ChoreItem, Member, MealItem, ShoppingItem, WeekDay } from '@/lib/data'
import {
  addChore,
  updateMeal,
  addShoppingItem,
  removeShoppingItem,
  signOut,
  toggleOccurrence,
  toggleShoppingItem,
} from './actions'

const personTones: Record<string, string> = {
  mint: 'bg-mint-tint text-mint',
  peach: 'bg-peach-tint text-peach',
  lavender: 'bg-lavender-tint text-lavender',
  sand: 'bg-gold-tint text-gold',
}

const tonePool = ['mint', 'peach', 'lavender', 'sand']

const mealTones: Record<string, string> = {
  breakfast: 'bg-gold-tint',
  lunch: 'bg-peach-tint',
  dinner: 'bg-mint-tint',
}

const dotColors = ['bg-gold', 'bg-mint', 'bg-rose', 'bg-lavender']

const taskCategories = {
  Kitchen: ['Wash Utensils', 'Load Dishwasher', 'Unload Dishwasher', 'Clean Kitchen', 'Clean Fridge', 'Wipe Counters'],
  Laundry: ['Wash Clothes', 'Dry Clothes', 'Fold Clothes', 'Iron Clothes', 'Put Clothes Away', 'Change Bedsheets'],
  Cleaning: ['Vacuum', 'Sweep Floor', 'Mop Floor', 'Dust Surfaces', 'Clean Bathroom', 'Clean Windows', 'Tidy Room'],
  Meals: ['Make Breakfast', 'Cook Lunch', 'Cook Dinner', 'Prepare Snacks', 'Pack Lunch', 'Plan Meals', 'Set Table', 'Clear Table'],
  Shopping: ['Buy Groceries', 'Buy Essentials', 'Collect Order', 'Return Item'],
  'Bins & Garden': ['Take Bins Out', 'Bring Bins In', 'Empty Bins', 'Sort Recycling', 'Mow Lawn', 'Water Plants'],
  'Study & Work': ['Study', 'Do Homework', 'Read', 'Revise', 'Practise Skill', 'Pack School Bag'],
  Family: ['School Drop-off', 'School Pick-up', 'Help Family'],
  'Personal & Admin': ['Exercise', 'Book Appointment', 'Pay Bill', 'Collect Prescription', 'Fix Something'],
} as const

const frequentTasks = ['Wash Utensils', 'Tidy Room', 'Take Bins Out', 'Buy Groceries', 'Clear Table', 'Vacuum']

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]
      row[j] = a[i - 1] === b[j - 1] ? previous : Math.min(previous, row[j - 1], current) + 1
      previous = current
    }
  }
  return row[b.length]
}

function Countdown({ dueAt, done }: { dueAt: string | null; done: boolean }) {
  const [minutes, setMinutes] = useState<number | null>(null)

  useEffect(() => {
    if (!dueAt || done) {
      setMinutes(null)
      return
    }
    const update = () => setMinutes(Math.max(0, Math.ceil((new Date(dueAt).getTime() - Date.now()) / 60000)))
    update()
    const timer = window.setInterval(update, 30000)
    return () => window.clearInterval(timer)
  }, [dueAt, done])

  if (minutes === null) return null
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const remainingMinutes = minutes % 60
  const countdown = minutes === 0
    ? 'Due now'
    : days > 0
      ? `${days}d${hours > 0 ? ` ${hours}h` : ''} left`
      : hours > 0
        ? `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''} left`
        : `${minutes} min left`

  return <span className={minutes <= 15 ? 'font-bold text-peach' : 'font-semibold text-success'}>{countdown}</span>
}

type Props = {
  profile: Member
  members: Member[]
  chores: ChoreItem[]
  meals: MealItem[]
  shopping: ShoppingItem[]
  week: WeekDay[]
  pendingChanges: number
  dateLabel: string
  greeting: string
}

export default function Dashboard({
  profile,
  members,
  chores,
  meals,
  shopping,
  week,
  pendingChanges,
  dateLabel,
  greeting,
}: Props) {
  const [activeNav, setActiveNav] = useState('Today')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState('Everyone')
  const [selectedWeekDay, setSelectedWeekDay] = useState<string | null>(null)
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newChore, setNewChore] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [taskCategory, setTaskCategory] = useState<string | null>(null)
  const [taskFrequency, setTaskFrequency] = useState<'once' | 'daily' | 'weekly'>('once')
  const [taskDate, setTaskDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date()))
  const [taskTime, setTaskTime] = useState('')
  const [taskDays, setTaskDays] = useState<number[]>([1])
  const [newItem, setNewItem] = useState('')
  const [editingMeals, setEditingMeals] = useState(false)
  const [mealDrafts, setMealDrafts] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const theme = profile.theme ?? 'system'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const useDark = theme === 'dark' || (theme === 'system' && prefersDark)
    document.cookie = `gharke-theme=${theme}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(useDark ? 'dark' : 'light')
  }, [profile.theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if ((profile.theme ?? 'system') !== 'system') return
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [profile.theme])

  

  const isAdmin = profile.role === 'admin'
  
  const filterNames = useMemo(() => ['Everyone', ...members.map((m) => m.display_name)], [members])
  const completed = useMemo(() => chores.filter((c) => c.done).length, [chores])
  const visibleChores =
    selectedPerson === 'Everyone' ? chores : chores.filter((c) => c.person === selectedPerson)

  const nextUp = chores.find((c) => !c.done)
  const dinner = meals.find((m) => m.slot === 'dinner')
  const remainingShopping = shopping.filter((s) => !s.purchased).length
  const normalizedSearch = taskSearch.trim().toLowerCase()
  const categoryMatches = Object.keys(taskCategories).filter((category) => {
    const value = category.toLowerCase()
    return !normalizedSearch || value.startsWith(normalizedSearch) || value.includes(normalizedSearch) || editDistance(normalizedSearch, value) <= 2
  })
  const pickerTasks = taskCategory
    ? [...taskCategories[taskCategory as keyof typeof taskCategories]].filter((task) => !normalizedSearch || task.toLowerCase().startsWith(normalizedSearch) || task.toLowerCase().includes(normalizedSearch)).sort((a, b) => {
        const aPrefix = a.toLowerCase().startsWith(normalizedSearch) ? 0 : 1
        const bPrefix = b.toLowerCase().startsWith(normalizedSearch) ? 0 : 1
        return aPrefix - bPrefix || a.localeCompare(b)
      })
    : (normalizedSearch ? Object.values(taskCategories).flat().filter((task) => task.toLowerCase().startsWith(normalizedSearch) || task.toLowerCase().includes(normalizedSearch)).sort((a, b) => (a.toLowerCase().startsWith(normalizedSearch) ? 0 : 1) - (b.toLowerCase().startsWith(normalizedSearch) ? 0 : 1)) : frequentTasks)
  const visiblePickerTasks = pickerTasks.length || !normalizedSearch ? pickerTasks : Object.values(taskCategories).flat().filter((task) => editDistance(normalizedSearch, task.toLowerCase()) <= 3).slice(0, 8)

  function runToggleChore(item: ChoreItem) {
    const canEdit = isAdmin || item.personId === profile.id
    if (!canEdit) return
    if (!item.done) {
      setCelebratingId(item.occurrenceId)
      window.setTimeout(() => setCelebratingId(null), 1150)
    }
    startTransition(() => toggleOccurrence(item.occurrenceId, !item.done))
  }

  function selectTask(title: string) {
    setNewChore(title)
    setTaskSearch(title)
  }

  function submitChore() {
  const title = newChore.trim()
    if (!title) return
    startTransition(async () => {
      await addChore({ title, assigneeId: profile.id, frequency: taskFrequency, date: taskDate, time: taskTime || undefined, weekdays: taskDays })
      setShowAdd(false)
    })
  }

  function openAddChore() {
    setNewChore('')
    setTaskSearch('')
    setTaskCategory(null)
    setTaskFrequency('once')
    setTaskDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date()))
    setTaskTime('')
    setTaskDays([1])
    setShowAdd(true)
  }

  function openMealEditor() {
    setMealDrafts(Object.fromEntries(meals.map((meal) => [meal.slot, meal.dish ?? ''])))
    setEditingMeals(true)
  }

  function saveMeals() {
    startTransition(async () => {
      for (const meal of meals) await updateMeal(meal.slot, mealDrafts[meal.slot] ?? '', meal.responsibleId)
      setEditingMeals(false)
      router.refresh()
    })
  }

  function submitItem() {
    const label = newItem.trim()
    if (!label) return
    startTransition(async () => {
      await addShoppingItem(label)
      setNewItem('')
    })
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <aside className="hidden w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar px-5 py-7 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div>
              <div className="flex items-center gap-2.5"><img src="/gharke-chore-brand.png" alt="GharKeChore" className="size-9 rounded-xl" /><div className="font-serif text-[20px] font-semibold tracking-[-0.02em]">GharKeChore</div></div>
              <div className="text-[13px] text-muted-foreground">Kaam karo, kaamchori nahi.</div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-2">
            {[
              { label: 'Today', icon: Home },
              { label: 'This week', icon: CalendarDays },
              { label: 'Meals', icon: CookingPot },
              { label: 'Shopping', icon: ShoppingBasket },
              { label: 'Changes', icon: RefreshCw },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActiveNav(label)
                  document.getElementById(label === 'Today' ? 'today' : label === 'This week' ? 'this-week' : label === 'Meals' ? 'meals' : label === 'Shopping' ? 'shopping' : 'changes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                  activeNav === label
                    ? 'bg-accent font-semibold text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="size-[18px]" />
                {label}
                {label === 'Changes' && pendingChanges > 0 && (
                  <span className="ml-auto rounded-full bg-rose-tint px-2 py-0.5 text-[10px] font-bold text-rose">
                    {pendingChanges}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2">
              <Link
                href="/settings"
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm text-muted-foreground hover:bg-muted"
              >
                <Settings2 className="size-[18px]" />
                Settings
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm text-muted-foreground hover:bg-muted"
                >
                  <Settings2 className="size-[18px]" />
                  Admin
                </Link>
              )}
            <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-5">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{profile.display_name}</div>
                <div className="text-xs capitalize text-muted-foreground">{profile.role}</div>
              </div>
              <button
                onClick={() => startTransition(() => signOut())}
                className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative flex h-full w-[min(82vw,280px)] flex-col bg-sidebar px-5 py-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3 px-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <img src="/gharke-chore-brand.png" alt="GharKeChore" className="size-9 rounded-xl" />
                    <div className="font-serif text-xl font-semibold">GharKeChore</div>
                  </div>
                  <div className="mt-1 text-[13px] text-muted-foreground">Kaam karo, kaamchori nahi.</div>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="flex size-10 items-center justify-center rounded-xl hover:bg-muted" aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              <nav className="mt-10 flex flex-col gap-2">
                {[
                  { label: 'Today', icon: Home },
                  { label: 'This week', icon: CalendarDays },
                  { label: 'Meals', icon: CookingPot },
                  { label: 'Shopping', icon: ShoppingBasket },
                  { label: 'Changes', icon: RefreshCw },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setActiveNav(label)
                      setMobileMenuOpen(false)
                      document.getElementById(label === 'Today' ? 'today' : label === 'This week' ? 'this-week' : label === 'Meals' ? 'meals' : label === 'Shopping' ? 'shopping' : 'changes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={`flex h-12 items-center gap-3 rounded-xl px-3 text-left text-sm transition ${activeNav === label ? 'bg-accent font-semibold text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Icon className="size-[18px]" />
                    {label}
                  </button>
                ))}
              </nav>
              <div className="mt-auto border-t border-sidebar-border pt-5">
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted">
                  <Settings2 className="size-[18px]" /> Settings
                </Link>
                {isAdmin && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted">
                  <Settings2 className="size-[18px]" /> Admin
                </Link>}
              </div>
            </aside>
          </div>
        )}

        <section className="min-w-0 w-full max-w-full flex-1 overflow-hidden px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-10 lg:px-12">
          <header className="flex items-center justify-between py-4 sm:py-6 lg:py-8">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="size-5" />
              </button>
              <div className="flex min-w-0 items-center gap-2">
                <img src="/gharke-chore-brand.png" alt="GharKeChore" className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <span className="block truncate font-serif text-lg font-semibold">GharKeChore</span>
                  <span className="block truncate text-[11px] leading-4 text-muted-foreground">Kaam karo, kaamchori nahi.</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                className="relative hidden size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted sm:flex"
                aria-label="Notifications"
              >
                <Bell className="size-[19px]" />
                {pendingChanges > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />}
              </button>
              <button
                onClick={() => startTransition(() => signOut())}
                className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-sm font-semibold shadow-sm sm:px-3"
              >
                <span className="hidden sm:inline">{profile.display_name}</span>
                <LogOut className="size-4 text-muted-foreground" />
              </button>
            </div>
          </header>

          <div className="mb-7 lg:hidden">
            <p className="text-sm font-medium text-muted-foreground">{dateLabel}</p>
            <h1 className="mt-1 font-serif text-[29px] font-semibold tracking-[-0.03em]">
              {greeting}, {profile.display_name}
            </h1>
          </div>

          <div className="-mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-8 sm:px-0">
            {filterNames.map((name, index) => (
              <button
                key={name}
                onClick={() => setSelectedPerson(name)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                  selectedPerson === name
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-mint'
                }`}
              >
                <span className={`size-2 rounded-full ${dotColors[index % dotColors.length]}`} />
                {name}
              </button>
            ))}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 overflow-hidden sm:gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="flex min-w-0 flex-col gap-3 sm:gap-6">
              <section id="today" className="w-full max-w-full min-w-0 scroll-mt-4 rounded-[14px] border border-border bg-card p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:scroll-mt-6 sm:rounded-[24px] sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-[21px] font-semibold sm:text-[24px]">Your chores</h2>
                      <span className="rounded-full bg-gold-tint px-2 py-1 text-[11px] font-bold text-gold">
                        {completed}/{chores.length} done
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">A little at a time makes a home.</p>
                  </div>
                  <button
                    onClick={openAddChore}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground hover:bg-accent/70"
                  >
                    <Plus className="size-4" />
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-col gap-1.5 sm:mt-6 sm:gap-2.5">
                  {visibleChores.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                      Nothing here yet. Enjoy the calm.
                    </div>
                  )}
          {visibleChores.map((task, index) => {
            const tone = personTones[tonePool[index % tonePool.length]]
            const canEdit = isAdmin || task.personId === profile.id
            return (
                      <div
                        key={task.occurrenceId}
                        className={`group relative flex items-center gap-3 rounded-2xl border px-3 py-3 transition sm:px-4 ${
                          task.done ? 'border-success/30 bg-success/10' : 'border-border bg-card'
                        }`}
                      >
                        {celebratingId === task.occurrenceId && <span className="completion-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>}
                        <button
                onClick={() => runToggleChore(task)}
                disabled={pending || !canEdit}
                title={canEdit ? (task.done ? 'Undo completion' : 'Mark complete') : 'Only the assignee or an admin can change this'}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            task.done
                              ? 'border-success bg-success text-success-foreground'
                              : 'border-border text-transparent hover:border-success'
                          }`}
                          aria-label={task.done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                        >
                          <Check className="size-4" />
                        </button>
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                          <ClipboardList className="size-[17px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-semibold ${task.done ? 'text-muted-foreground line-through' : ''}`}>
                            {task.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{task.person}</span>
                            <span className="size-0.5 rounded-full bg-border" />
                            <span>{task.time}</span>
                            <Countdown dueAt={task.dueAt} done={task.done} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section id="this-week" className="w-full max-w-full min-w-0 scroll-mt-6 rounded-[14px] border border-border bg-secondary p-2.5 sm:rounded-[24px] sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-foreground">This week</p>
                    <h2 className="mt-1 font-serif text-[21px] font-semibold sm:text-[24px]">A week at a glance</h2>
                  </div>
                  <button className="rounded-lg p-1.5 text-secondary-foreground hover:bg-secondary/60" aria-label="Open calendar">
                    <CalendarDays className="size-[18px]" />
                  </button>
                </div>
                <div className="mt-4 min-w-0 overflow-hidden pb-1 sm:mt-5">
                  <div className="grid w-full min-w-0 grid-cols-7 gap-0.5 sm:gap-2">
                  {week.map((item) => (
                    <button
                      key={item.iso}
                      onClick={() => setSelectedWeekDay(item.iso)}
                      className={`min-w-0 rounded-xl border p-1 text-center transition sm:rounded-2xl sm:p-3 ${
                        item.isToday
                          ? 'border-primary bg-primary text-primary-foreground shadow-md'
                          : 'border-border bg-card text-muted-foreground hover:border-mint'
                      }`}
                    >
                      <div className="truncate text-[8px] font-bold tracking-wide opacity-70 sm:text-[10px]">{item.day}</div>
                      <div className="mt-1 text-base font-semibold sm:text-xl">{item.date}</div>
                      <div
                        className={`mx-auto mt-2 size-1.5 rounded-full ${
                          item.tasks === 0 ? 'bg-transparent' : item.isToday ? 'bg-gold' : 'bg-mint'
                        }`}
                      />
                    </button>
                  ))}
                  </div>
                </div>
                {selectedWeekDay && (() => {
                  const selected = week.find((day) => day.iso === selectedWeekDay)
                  return selected ? <div className="mt-5 rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-secondary-foreground">Tasks for {selected.day} {selected.date}</p><button onClick={() => setSelectedWeekDay(null)} className="text-xs font-bold text-secondary-foreground">Close</button></div>
                    <div className="flex flex-col gap-2">{selected.taskItems.length ? selected.taskItems.map((task) => <div key={task.id} className={`flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm ${task.done ? 'text-muted-foreground line-through' : 'font-semibold text-foreground'}`}><span>{task.title}</span><span className="text-xs font-normal no-underline">{task.person}</span></div>) : <p className="text-sm text-muted-foreground">No tasks planned.</p>}</div>
                  </div> : null
                })()}
                <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-border pt-3 sm:mt-5 sm:gap-3 sm:pt-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Utensils className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-secondary-foreground">Tonight&apos;s dinner</p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {dinner?.dish ?? 'Not planned yet'}
                      {dinner?.personName && <span className="font-normal text-muted-foreground"> · {dinner.personName}</span>}
                    </p>
                  </div>
                  <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <section className="w-full max-w-full min-w-0 overflow-hidden rounded-[14px] border border-border bg-primary p-3 text-primary-foreground sm:rounded-[24px] sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-foreground/70">
                    <Clock3 className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-[0.15em]">Next up</span>
                  </div>
                </div>
                <h2 className="mt-3 font-serif text-[22px] font-semibold sm:mt-5 sm:text-[26px]">{nextUp?.title ?? 'All done for today'}</h2>
                <p className="mt-1 text-sm text-primary-foreground/70">
                  {nextUp ? `${nextUp.person} · ${nextUp.time}` : 'A calm reset for the evening ahead.'}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-primary-foreground/15 pt-4">
                  <span className="text-xs text-primary-foreground/70">{dateLabel}</span>
                  {nextUp && (
                    <button
                      onClick={() => runToggleChore(nextUp)}
                      disabled={pending}
                      className="rounded-xl bg-cta px-3 py-2 text-xs font-bold text-cta-foreground hover:opacity-90"
                    >
                      Done
                    </button>
                  )}
                </div>
              </section>

              <section id="meals" className="w-full max-w-full min-w-0 scroll-mt-6 rounded-[14px] border border-border bg-card p-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:rounded-[24px] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-[23px] font-semibold">Meals today</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{dateLabel}</p>
                  </div>
                  <button onClick={openMealEditor} className="text-xs font-bold text-success">
                    Edit
                  </button>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-4">
                  {meals.map((meal) => (
                    <div key={meal.slot} className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${mealTones[meal.slot]}`}
                      >
                        <Utensils className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{meal.slot}</p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {meal.dish ?? 'Up to the family'}
                        </p>
                      </div>
                      <select
                    aria-label={`Assign ${meal.slot}`}
                    value={meal.responsibleId ?? ''}
                    onChange={(event) => {
                      startTransition(async () => {
                        await updateMeal(meal.slot, meal.dish ?? '', event.target.value || null)
                        router.refresh()
                      })
                    }}
                    disabled={pending}
                    className="max-w-[5.75rem] shrink-0 truncate appearance-none rounded-lg border-0 bg-transparent px-1 py-1 text-right text-[10px] text-success outline-none ring-1 ring-transparent focus:ring-success/50 disabled:opacity-60 sm:max-w-none sm:text-[11px]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.display_name}</option>
                    ))}
                  </select>
                    </div>
                  ))}
                </div>
                {editingMeals && <div className="mt-5 border-t border-border pt-4"><div className="flex flex-col gap-3">{meals.map((meal) => <label key={meal.slot} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{meal.slot}<input value={mealDrafts[meal.slot] ?? ''} onChange={(e) => setMealDrafts((drafts) => ({ ...drafts, [meal.slot]: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-input px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-success" placeholder="What are we having?" /></label>)}</div><div className="mt-4 flex justify-end gap-2"><button onClick={() => setEditingMeals(false)} className="rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground">Cancel</button><button onClick={saveMeals} disabled={pending || !isAdmin} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">Save meals</button></div>{!isAdmin && <p className="mt-2 text-xs text-peach">Only an admin can edit the family meal plan.</p>}</div>}
              </section>

              <section id="shopping" className="w-full max-w-full min-w-0 scroll-mt-6 rounded-[14px] border border-border bg-card p-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:rounded-[24px] sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-peach-tint text-peach">
                      <ShoppingBasket className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-serif text-[20px] font-semibold">Shopping</h2>
                      <p className="text-xs text-muted-foreground">{remainingShopping} to buy</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  {shopping.map((item) => (
                    <div key={item.id} className="group flex items-center gap-3 rounded-xl px-1 py-1.5">
                      <button
                        onClick={() => startTransition(() => toggleShoppingItem(item.id, !item.purchased))}
                        disabled={pending}
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                          item.purchased
                            ? 'border-success bg-success text-success-foreground'
                            : 'border-border text-transparent hover:border-success'
                        }`}
                        aria-label={item.purchased ? `Mark ${item.label} not bought` : `Mark ${item.label} bought`}
                      >
                        <Check className="size-3.5" />
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.purchased ? 'text-muted-foreground line-through' : 'font-medium text-foreground'
                        }`}
                      >
                        {item.label}
                        {item.quantity && <span className="ml-1 text-xs text-muted-foreground">· {item.quantity}</span>}
                      </span>
                      <button
                        onClick={() => startTransition(() => removeShoppingItem(item.id))}
                        disabled={pending}
                        className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                        aria-label={`Remove ${item.label}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  {shopping.length === 0 && (
                    <p className="px-1 py-4 text-center text-sm text-muted-foreground">Nothing on the list.</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) submitItem()
                    }}
                    className="h-10 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-success"
                    placeholder="Add an item"
                  />
                  <button
                    onClick={submitItem}
                    disabled={pending || !newItem.trim()}
                    className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
                    aria-label="Add shopping item"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </section>
            </div>
          </div>

          <footer id="changes" className="scroll-mt-6 mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
            <span>GharKeChore · London time</span>
            <div className="flex gap-4">
              <button className="hover:text-primary">Need help</button>
              <button className="hover:text-primary">Notification settings</button>
            </div>
          </footer>
        </section>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[88vh] w-full max-w-md flex-col rounded-[24px] bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-serif text-xl font-semibold">Add a one-off chore</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Add it once, every day, or on selected weekdays.</p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input value={taskSearch} onChange={(e) => { setTaskSearch(e.target.value); setNewChore(e.target.value) }} onKeyDown={(e) => { if (e.key === 'Enter' && visiblePickerTasks[0]) selectTask(visiblePickerTasks[0]) }} autoFocus className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-success" placeholder="Search a task or category..." aria-label="Search task or category" />
                  {taskCategory && <div className="mt-2 flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-mint-tint px-3 py-1 text-xs font-bold text-mint">{taskCategory}<button type="button" onClick={() => setTaskCategory(null)} aria-label="Remove category"><X className="size-3" /></button></span></div>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!taskCategory && categoryMatches.slice(0, 4).map((category) => <button type="button" key={category} onClick={() => { setTaskCategory(category); setTaskSearch('') }} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-mint-tint">{category}</button>)}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2" role="listbox" aria-label="Suggested tasks">
                    {visiblePickerTasks.map((task) => <button type="button" key={task} onClick={() => selectTask(task)} className="flex min-h-10 items-center justify-between rounded-xl border border-border bg-card px-3 text-left text-sm text-foreground hover:border-success hover:bg-success/10" role="option"><span>{task}</span><ChevronRight className="size-4 text-muted-foreground" /></button>)}
                  </div>
                  <button type="button" onClick={() => { setNewChore(taskSearch.trim()); setTaskSearch(taskSearch.trim()) }} className="mt-2 text-xs font-bold text-mint hover:underline">+ Add custom task</button>
                </div>
                <p className="text-xs text-muted-foreground">This task will be assigned only to you.</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">When?
                    <select value={taskFrequency} onChange={(e) => setTaskFrequency(e.target.value as typeof taskFrequency)} className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-normal outline-none"><option value="once">One time</option><option value="daily">Every day</option><option value="weekly">Selected days</option></select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">Start date<input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-normal outline-none" /></label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">Time <span className="font-normal text-muted-foreground">optional</span><input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-normal outline-none" /></label>
                </div>
                {taskFrequency === 'weekly' && <div className="flex flex-wrap gap-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, index) => <button type="button" key={day} onClick={() => setTaskDays((days) => days.includes(index) ? days.filter((d) => d !== index) : [...days, index])} className={`rounded-full px-3 py-1.5 text-xs font-bold ${taskDays.includes(index) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{day}</button>)}</div>}
              </div>
            </div>
            <div className="border-t border-border px-5 py-4">
              <button onClick={submitChore} disabled={pending || !newChore.trim()} className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50">Add task</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
