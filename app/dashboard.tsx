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
  Leaf,
  Moon,
  Star,
  Sun,
  UserRound,
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
  mint: 'bg-[#e3f0eb] text-[#4f8e80]',
  peach: 'bg-[#f8e9df] text-[#b6775a]',
  lavender: 'bg-[#eceafa] text-[#756fa8]',
  sand: 'bg-[#f3ecdc] text-[#a1834f]',
}

const tonePool = ['mint', 'peach', 'lavender', 'sand']
const avatarIcons = { leaf: Leaf, sun: Sun, moon: Moon, flower: Star, star: Star, home: UserRound }

const mealTones: Record<string, string> = {
  breakfast: 'bg-[#f3ecdc]',
  lunch: 'bg-[#f8e9df]',
  dinner: 'bg-[#e3f0eb]',
}

const dotColors = ['bg-[#d9c7a7]', 'bg-[#b8d6ce]', 'bg-[#e6bfd0]', 'bg-[#c8c5e7]']

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

  return <span className={minutes <= 15 ? 'font-bold text-[#b6775a]' : 'font-semibold text-[#5a8177]'}>{countdown}</span>
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
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [profile.theme])

  const isAdmin = profile.role === 'admin'
  const AvatarIcon = avatarIcons[(profile.avatar_key ?? 'leaf') as keyof typeof avatarIcons] ?? Leaf

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
      setNewChore('')
      setShowAdd(false)
    })
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
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f8f7f2] text-[#27322f]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <aside className="hidden w-[248px] shrink-0 border-r border-[#e5e3db] bg-[#fbfaf6] px-5 py-7 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div>
              <div className="flex items-center gap-2.5"><img src="/gharke-chore-brand.png" alt="GharKeChore" className="size-9 rounded-xl" /><div className="font-serif text-[20px] font-semibold tracking-[-0.02em]">GharKeChore</div></div>
              <div className="text-[11px] text-[#87918a]">Kaam karo, kaamchori nahi.</div>
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
                    ? 'bg-[#e8f0eb] font-semibold text-[#244c46]'
                    : 'text-[#6f7973] hover:bg-[#f0efe8]'
                }`}
              >
                <Icon className="size-[18px]" />
                {label}
                {label === 'Changes' && pendingChanges > 0 && (
                  <span className="ml-auto rounded-full bg-[#e6bfd0] px-2 py-0.5 text-[10px] font-bold text-[#613c4b]">
                    {pendingChanges}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2">
              <Link
                href="/settings"
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm text-[#6f7973] hover:bg-[#f0efe8]"
              >
                <Settings2 className="size-[18px]" />
                Settings
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm text-[#6f7973] hover:bg-[#f0efe8]"
                >
                  <Settings2 className="size-[18px]" />
                  Admin
                </Link>
              )}
            <div className="mt-4 flex items-center gap-3 border-t border-[#e5e3db] px-2 pt-5">
<div className="flex size-9 items-center justify-center rounded-full bg-[#b8d6ce] text-[#294c47]">
                  <AvatarIcon className="size-4" />
                </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{profile.display_name}</div>
                <div className="text-xs capitalize text-[#87918a]">{profile.role}</div>
              </div>
              <button
                onClick={() => startTransition(() => signOut())}
                className="ml-auto rounded-lg p-1.5 text-[#87918a] hover:bg-[#f0efe8] hover:text-[#244c46]"
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
              className="absolute inset-0 bg-[#27322f]/30"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative flex h-full w-[min(82vw,280px)] flex-col bg-[#fbfaf6] px-5 py-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3 px-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <img src="/gharke-chore-brand.png" alt="GharKeChore" className="size-9 rounded-xl" />
                    <div className="font-serif text-xl font-semibold">GharKeChore</div>
                  </div>
                  <div className="mt-1 text-[11px] text-[#87918a]">Kaam karo, kaamchori nahi.</div>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="flex size-10 items-center justify-center rounded-xl hover:bg-[#f0efe8]" aria-label="Close menu">
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
                    className={`flex h-12 items-center gap-3 rounded-xl px-3 text-left text-sm transition ${activeNav === label ? 'bg-[#e8f0eb] font-semibold text-[#244c46]' : 'text-[#6f7973] hover:bg-[#f0efe8]'}`}
                  >
                    <Icon className="size-[18px]" />
                    {label}
                  </button>
                ))}
              </nav>
              <div className="mt-auto border-t border-[#e5e3db] pt-5">
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm text-[#6f7973] hover:bg-[#f0efe8]">
                  <Settings2 className="size-[18px]" /> Settings
                </Link>
                {isAdmin && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm text-[#6f7973] hover:bg-[#f0efe8]">
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
                className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-[#efeee7]"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="size-5" />
              </button>
              <div className="flex min-w-0 items-center gap-2">
                <img src="/gharke-chore-brand.png" alt="GharKeChore" className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <span className="block truncate font-serif text-lg font-semibold">GharKeChore</span>
                  <span className="block truncate text-[9px] leading-3 text-[#87918a]">Kaam karo, kaamchori nahi.</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                className="relative hidden size-11 items-center justify-center rounded-xl text-[#6f7973] hover:bg-[#efeee7] sm:flex"
                aria-label="Notifications"
              >
                <Bell className="size-[19px]" />
                {pendingChanges > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#c16b6b]" />}
              </button>
              <button
                onClick={() => startTransition(() => signOut())}
                className="flex h-11 items-center gap-2 rounded-xl border border-[#e5e3db] bg-white px-2.5 py-2 text-sm font-semibold shadow-sm sm:px-3"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-[#b8d6ce] text-[#294c47]">
                  <AvatarIcon className="size-3.5" />
                </div>
                <span className="hidden sm:inline">{profile.display_name}</span>
                <LogOut className="size-4 text-[#87918a]" />
              </button>
            </div>
          </header>

          <div className="mb-7 lg:hidden">
            <p className="text-sm font-medium text-[#87918a]">{dateLabel}</p>
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
                    ? 'border-[#244c46] bg-[#244c46] text-white'
                    : 'border-[#e5e3db] bg-white text-[#6f7973] hover:border-[#b8d6ce]'
                }`}
              >
                <span className={`size-2 rounded-full ${dotColors[index % dotColors.length]}`} />
                {name}
              </button>
            ))}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 overflow-hidden sm:gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="flex min-w-0 flex-col gap-3 sm:gap-6">
              <section id="today" className="w-full max-w-full min-w-0 scroll-mt-4 rounded-[14px] border border-[#e8e6de] bg-white p-2.5 shadow-[0_8px_30px_rgba(54,67,61,0.04)] sm:scroll-mt-6 sm:rounded-[24px] sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-[21px] font-semibold sm:text-[24px]">Your chores</h2>
                      <span className="rounded-full bg-[#f2eee4] px-2 py-1 text-[11px] font-bold text-[#967d54]">
                        {completed}/{chores.length} done
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#87918a]">A little at a time makes a home.</p>
                  </div>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#edf3ef] px-3 py-2 text-xs font-bold text-[#244c46] hover:bg-[#e2eee7]"
                  >
                    <Plus className="size-4" />
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-col gap-1.5 sm:mt-6 sm:gap-2.5">
                  {visibleChores.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#e1ded3] bg-[#fdfcf9] px-4 py-10 text-center text-sm text-[#97a19b]">
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
                          task.done ? 'border-[#e1eae4] bg-[#f7fbf8]' : 'border-[#eeede7] bg-[#fdfcf9]'
                        }`}
                      >
                        {celebratingId === task.occurrenceId && <span className="completion-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>}
                        <button
                onClick={() => runToggleChore(task)}
                disabled={pending || !canEdit}
                title={canEdit ? (task.done ? 'Undo completion' : 'Mark complete') : 'Only the assignee or an admin can change this'}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            task.done
                              ? 'border-[#5a9b8c] bg-[#5a9b8c] text-white'
                              : 'border-[#d6ddd8] text-transparent hover:border-[#5a9b8c]'
                          }`}
                          aria-label={task.done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                        >
                          <Check className="size-4" />
                        </button>
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                          <ClipboardList className="size-[17px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-semibold ${task.done ? 'text-[#96a19b] line-through' : ''}`}>
                            {task.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#97a19b]">
                            <span>{task.person}</span>
                            <span className="size-0.5 rounded-full bg-[#c3ccc6]" />
                            <span>{task.time}</span>
                            <Countdown dueAt={task.dueAt} done={task.done} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section id="this-week" className="w-full max-w-full min-w-0 scroll-mt-6 rounded-[14px] border border-[#e8e6de] bg-[#f2eee4] p-2.5 sm:rounded-[24px] sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#967d54]">This week</p>
                    <h2 className="mt-1 font-serif text-[21px] font-semibold sm:text-[24px]">A week at a glance</h2>
                  </div>
                  <button className="rounded-lg p-1.5 text-[#967d54] hover:bg-[#e7dfcf]" aria-label="Open calendar">
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
                          ? 'border-[#244c46] bg-[#244c46] text-white shadow-md'
                          : 'border-[#e3dccd] bg-[#f8f5ed] text-[#6f7973] hover:border-[#b8d6ce]'
                      }`}
                    >
                      <div className="truncate text-[8px] font-bold tracking-wide opacity-70 sm:text-[10px]">{item.day}</div>
                      <div className="mt-1 text-base font-semibold sm:text-xl">{item.date}</div>
                      <div
                        className={`mx-auto mt-2 size-1.5 rounded-full ${
                          item.tasks === 0 ? 'bg-transparent' : item.isToday ? 'bg-[#f4e4c8]' : 'bg-[#b8d6ce]'
                        }`}
                      />
                    </button>
                  ))}
                  </div>
                </div>
                {selectedWeekDay && (() => {
                  const selected = week.find((day) => day.iso === selectedWeekDay)
                  return selected ? <div className="mt-5 rounded-2xl border border-[#e1d8c8] bg-[#f8f5ed] p-4">
                    <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[#967d54]">Tasks for {selected.day} {selected.date}</p><button onClick={() => setSelectedWeekDay(null)} className="text-xs font-bold text-[#967d54]">Close</button></div>
                    <div className="flex flex-col gap-2">{selected.taskItems.length ? selected.taskItems.map((task) => <div key={task.id} className={`flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ${task.done ? 'text-[#a1aaa4] line-through' : 'font-semibold text-[#3f4b46]'}`}><span>{task.title}</span><span className="text-xs font-normal no-underline">{task.person}</span></div>) : <p className="text-sm text-[#97a19b]">No tasks planned.</p>}</div>
                  </div> : null
                })()}
                <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-[#e1d8c8] pt-3 sm:mt-5 sm:gap-3 sm:pt-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#e7dfcf] text-[#967d54]">
                    <Utensils className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#967d54]">Tonight&apos;s dinner</p>
                    <p className="truncate text-sm font-semibold text-[#493d2d]">
                      {dinner?.dish ?? 'Not planned yet'}
                      {dinner?.personName && <span className="font-normal text-[#968c7b]"> · {dinner.personName}</span>}
                    </p>
                  </div>
                  <ChevronRight className="ml-auto size-4 text-[#aa9e8b]" />
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <section className="w-full max-w-full min-w-0 overflow-hidden rounded-[14px] border border-[#e8e6de] bg-[#244c46] p-3 text-white sm:rounded-[24px] sm:p-6 shadow-[0_12px_35px_rgba(36,76,70,0.13)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#b8d6ce]">
                    <Clock3 className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-[0.15em]">Next up</span>
                  </div>
                </div>
                <h2 className="mt-3 font-serif text-[22px] font-semibold sm:mt-5 sm:text-[26px]">{nextUp?.title ?? 'All done for today'}</h2>
                <p className="mt-1 text-sm text-[#b8d6ce]">
                  {nextUp ? `${nextUp.person} · ${nextUp.time}` : 'A calm reset for the evening ahead.'}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4">
                  <span className="text-xs text-[#b8d6ce]">{dateLabel}</span>
                  {nextUp && (
                    <button
                      onClick={() => runToggleChore(nextUp)}
                      disabled={pending}
                      className="rounded-xl bg-[#f4e4c8] px-3 py-2 text-xs font-bold text-[#493d2d] hover:bg-white"
                    >
                      Done
                    </button>
                  )}
                </div>
              </section>

              <section id="meals" className="w-full max-w-full min-w-0 scroll-mt-6 rounded-[14px] border border-[#e8e6de] bg-white p-3 shadow-[0_8px_30px_rgba(54,67,61,0.04)] sm:rounded-[24px] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-[23px] font-semibold">Meals today</h2>
                    <p className="mt-1 text-xs text-[#87918a]">{dateLabel}</p>
                  </div>
                  <button onClick={openMealEditor} className="text-xs font-bold text-[#5a8177]">
                    Edit
                  </button>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-4">
                  {meals.map((meal) => (
                    <div key={meal.slot} className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${mealTones[meal.slot]}`}
                      >
                        <Utensils className="size-4 text-[#6f7973]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#a1aaa4]">{meal.slot}</p>
                        <p className="truncate text-sm font-semibold text-[#3f4b46]">
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
                    className="max-w-[5.75rem] shrink-0 truncate appearance-none rounded-lg border-0 bg-transparent px-1 py-1 text-right text-[10px] text-[#5a8177] outline-none ring-1 ring-transparent focus:ring-[#9bbdb3] disabled:opacity-60 sm:max-w-none sm:text-[11px]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.display_name}</option>
                    ))}
                  </select>
                    </div>
                  ))}
                </div>
                {editingMeals && <div className="mt-5 border-t border-[#e8e6de] pt-4"><div className="flex flex-col gap-3">{meals.map((meal) => <label key={meal.slot} className="text-xs font-bold uppercase tracking-wider text-[#87918a]">{meal.slot}<input value={mealDrafts[meal.slot] ?? ''} onChange={(e) => setMealDrafts((drafts) => ({ ...drafts, [meal.slot]: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[#e2e5df] px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#5a9b8c]" placeholder="What are we having?" /></label>)}</div><div className="mt-4 flex justify-end gap-2"><button onClick={() => setEditingMeals(false)} className="rounded-xl px-3 py-2 text-xs font-bold text-[#87918a]">Cancel</button><button onClick={saveMeals} disabled={pending || !isAdmin} className="rounded-xl bg-[#244c46] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Save meals</button></div>{!isAdmin && <p className="mt-2 text-xs text-[#b6775a]">Only an admin can edit the family meal plan.</p>}</div>}
              </section>

              <section id="shopping" className="w-full max-w-full min-w-0 scroll-mt-6 rounded-[14px] border border-[#e8e6de] bg-white p-3 shadow-[0_8px_30px_rgba(54,67,61,0.04)] sm:rounded-[24px] sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f8e9df] text-[#b6775a]">
                      <ShoppingBasket className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-serif text-[20px] font-semibold">Shopping</h2>
                      <p className="text-xs text-[#87918a]">{remainingShopping} to buy</p>
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
                            ? 'border-[#5a9b8c] bg-[#5a9b8c] text-white'
                            : 'border-[#d6ddd8] text-transparent hover:border-[#5a9b8c]'
                        }`}
                        aria-label={item.purchased ? `Mark ${item.label} not bought` : `Mark ${item.label} bought`}
                      >
                        <Check className="size-3.5" />
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.purchased ? 'text-[#a7b0aa] line-through' : 'font-medium text-[#3f4b46]'
                        }`}
                      >
                        {item.label}
                        {item.quantity && <span className="ml-1 text-xs text-[#a1aaa4]">· {item.quantity}</span>}
                      </span>
                      <button
                        onClick={() => startTransition(() => removeShoppingItem(item.id))}
                        disabled={pending}
                        className="rounded-md p-1 text-[#c3ccc6] opacity-0 transition hover:text-[#c16b6b] group-hover:opacity-100"
                        aria-label={`Remove ${item.label}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  {shopping.length === 0 && (
                    <p className="px-1 py-4 text-center text-sm text-[#97a19b]">Nothing on the list.</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) submitItem()
                    }}
                    className="h-10 flex-1 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-3 text-sm outline-none focus:border-[#5a9b8c]"
                    placeholder="Add an item"
                  />
                  <button
                    onClick={submitItem}
                    disabled={pending || !newItem.trim()}
                    className="flex size-10 items-center justify-center rounded-xl bg-[#244c46] text-white hover:bg-[#1c3d38] disabled:opacity-50"
                    aria-label="Add shopping item"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </section>
            </div>
          </div>

          <footer id="changes" className="scroll-mt-6 mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e3db] pt-5 text-xs text-[#97a19b]">
            <span>GharKeChore · London time</span>
            <div className="flex gap-4">
              <button className="hover:text-[#244c46]">Need help</button>
              <button className="hover:text-[#244c46]">Notification settings</button>
            </div>
          </footer>
        </section>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-[#27322f]/20 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold">Add a one-off chore</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg p-2 text-[#87918a] hover:bg-[#f2f3ed]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#87918a]">Add it once, every day, or on selected weekdays.</p>
            <div className="mt-6 flex flex-col gap-3">
              <div className="relative">
                <input value={taskSearch} onChange={(e) => { setTaskSearch(e.target.value); setNewChore(e.target.value) }} onKeyDown={(e) => { if (e.key === 'Enter' && visiblePickerTasks[0]) selectTask(visiblePickerTasks[0]) }} autoFocus className="h-12 w-full rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-4 text-sm outline-none focus:border-[#5a9b8c]" placeholder="Search a task or category..." aria-label="Search task or category" />
                {taskCategory && <div className="mt-2 flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-[#e3f0eb] px-3 py-1 text-xs font-bold text-[#397568]">{taskCategory}<button type="button" onClick={() => setTaskCategory(null)} aria-label="Remove category"><X className="size-3" /></button></span></div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {!taskCategory && categoryMatches.slice(0, 4).map((category) => <button type="button" key={category} onClick={() => { setTaskCategory(category); setTaskSearch('') }} className="rounded-full bg-[#f2f3ed] px-3 py-1.5 text-xs font-semibold text-[#53635c] hover:bg-[#e3f0eb]">{category}</button>)}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" role="listbox" aria-label="Suggested tasks">
                  {visiblePickerTasks.map((task) => <button type="button" key={task} onClick={() => selectTask(task)} className="flex min-h-11 items-center justify-between rounded-xl border border-[#e8e6de] bg-white px-3 text-left text-sm text-[#34423c] hover:border-[#8bb9aa] hover:bg-[#f3f8f5]" role="option"><span>{task}</span><ChevronRight className="size-4 text-[#9aa8a0]" /></button>)}
                </div>
                <button type="button" onClick={() => { setNewChore(taskSearch.trim()); setTaskSearch(taskSearch.trim()) }} className="mt-3 text-xs font-bold text-[#397568] hover:underline">+ Add custom task</button>
              </div>
  <p className="text-xs text-[#7f8983]">This task will be assigned only to you.</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs font-bold text-[#6f7973]">When?
                  <select value={taskFrequency} onChange={(e) => setTaskFrequency(e.target.value as typeof taskFrequency)} className="h-11 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-3 text-sm font-normal outline-none"><option value="once">One time</option><option value="daily">Every day</option><option value="weekly">Selected days</option></select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-[#6f7973]">Start date<input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="h-11 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-3 text-sm font-normal outline-none" /></label>
                <label className="flex flex-col gap-1 text-xs font-bold text-[#6f7973]">Time <span className="font-normal text-[#a0a7a1]">optional</span><input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="h-11 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-3 text-sm font-normal outline-none" /></label>
              </div>
              {taskFrequency === 'weekly' && <div className="flex flex-wrap gap-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, index) => <button type="button" key={day} onClick={() => setTaskDays((days) => days.includes(index) ? days.filter((d) => d !== index) : [...days, index])} className={`rounded-full px-3 py-1.5 text-xs font-bold ${taskDays.includes(index) ? 'bg-[#244c46] text-white' : 'bg-[#f2f3ed] text-[#6f7973]'}`}>{day}</button>)}</div>}
              <button onClick={submitChore} disabled={pending || !newChore.trim()} className="h-12 rounded-xl bg-[#244c46] text-sm font-bold text-white hover:bg-[#1c3d38] disabled:cursor-not-allowed disabled:opacity-50">Add task</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
