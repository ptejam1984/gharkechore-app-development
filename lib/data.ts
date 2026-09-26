import type { SupabaseClient } from '@supabase/supabase-js'

export type Member = {
  id: string
  display_name: string
  role: string
  avatar_key?: string
  theme?: 'system' | 'light' | 'dark'
  notifications_enabled?: boolean
  google_calendar_connected?: boolean
  family_calendar_id?: string | null
}

export type ChoreItem = {
  occurrenceId: string
  title: string
  person: string
  personId: string | null
  time: string
  dueAt: string | null
  done: boolean
  status: string
}

export type MealItem = {
  slot: 'breakfast' | 'lunch' | 'dinner'
  dish: string | null
  personName: string | null
}

export type ShoppingItem = {
  id: string
  label: string
  quantity: string | null
  purchased: boolean
}

export type WeekDay = {
  day: string
  date: string
  iso: string
  tasks: number
  taskItems: Array<{ id: string; title: string; person: string; done: boolean }>
  meal: string | null
  isToday: boolean
}

const TZ = 'Europe/London'

export function londonToday(): Date {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00`)
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function ukLocalDateTimeToIso(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const target = Date.UTC(year, month - 1, day, hour, minute)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(target))
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const displayed = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'))
  return new Date(target + (target - displayed)).toISOString()
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function weekStart(d: Date): Date {
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day // Monday as start
  return addDays(d, diff)
}

export function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

type DB = SupabaseClient

export async function getMembers(supabase: DB): Promise<Member[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, role, avatar_key, theme, notifications_enabled, google_calendar_connected')
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getTodayChores(supabase: DB, day: string): Promise<ChoreItem[]> {
  const { data } = await supabase
    .from('chore_occurrences')
    .select(
      'id, status, due_at, occurrence_date, template:chore_templates(title, due_time), assignee:profiles!chore_occurrences_assigned_to_fkey(id, display_name)',
    )
    .eq('occurrence_date', day)
    .order('due_at', { ascending: true, nullsFirst: false })

  return (data ?? []).map((row: any) => {
    const dueTime: string | null = row.template?.due_time ?? null
    let time = 'Anytime'
    if (dueTime) {
      const [h, m] = dueTime.split(':')
      const dt = new Date()
      dt.setHours(Number(h), Number(m))
      time = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).format(dt)
    }
    return {
      occurrenceId: row.id,
      title: row.template?.title ?? 'Chore',
      person: row.assignee?.display_name ?? 'Unassigned',
      personId: row.assignee?.id ?? null,
      time,
      dueAt: row.due_at ?? (dueTime ? ukLocalDateTimeToIso(row.occurrence_date, dueTime) : null),
      done: row.status === 'done',
      status: row.status,
    }
  })
}

export async function getTodayMeals(supabase: DB, day: string): Promise<MealItem[]> {
  const { data } = await supabase
    .from('meals')
    .select('slot, dish_name, responsible:profiles(display_name)')
    .eq('meal_date', day)

  const slots: Array<MealItem['slot']> = ['breakfast', 'lunch', 'dinner']
  return slots.map((slot) => {
    const row: any = (data ?? []).find((m: any) => m.slot === slot)
    return {
      slot,
      dish: row?.dish_name ?? null,
      personName: row?.responsible?.display_name ?? null,
    }
  })
}

export async function getShopping(supabase: DB): Promise<ShoppingItem[]> {
  const { data } = await supabase
    .from('shopping_items')
    .select('id, label, quantity, purchased')
    .order('purchased', { ascending: true })
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getPendingChanges(supabase: DB): Promise<number> {
  const { count } = await supabase
    .from('change_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count ?? 0
}

export async function getWeek(supabase: DB, today: Date): Promise<WeekDay[]> {
  const start = weekStart(today)
  const end = addDays(start, 6)
  const startIso = iso(start)
  const endIso = iso(end)
  const todayIso = iso(today)

  const [{ data: occ }, { data: meals }] = await Promise.all([
    supabase.from('chore_occurrences').select('id, template_id, assigned_to, occurrence_date, status').gte('occurrence_date', startIso).lte('occurrence_date', endIso),
    supabase.from('meals').select('meal_date, dish_name').eq('slot', 'dinner').gte('meal_date', startIso).lte('meal_date', endIso),
  ])

  const templateIds = [...new Set((occ ?? []).map((row) => row.template_id))]
  const profileIds = [...new Set((occ ?? []).map((row) => row.assigned_to).filter(Boolean))]
  const [{ data: templates }, { data: profiles }] = await Promise.all([
    templateIds.length ? supabase.from('chore_templates').select('id, title').in('id', templateIds) : Promise.resolve({ data: [] }),
    profileIds.length ? supabase.from('profiles').select('id, display_name').in('id', profileIds) : Promise.resolve({ data: [] }),
  ])
  const templateNames = new Map((templates ?? []).map((template) => [template.id, template.title]))
  const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]))
  const tasksByDay = new Map<string, Array<{ id: string; title: string; person: string; done: boolean }>>()
  for (const row of occ ?? []) {
    const list = tasksByDay.get(row.occurrence_date) ?? []
    list.push({ id: row.id, title: templateNames.get(row.template_id) ?? 'Untitled task', person: row.assigned_to ? profileNames.get(row.assigned_to) ?? 'Unknown member' : 'Unassigned', done: row.status === 'done' })
    tasksByDay.set(row.occurrence_date, list)
  }
  const dinners = new Map<string, string>()
  for (const row of meals ?? []) if (row.dish_name) dinners.set(row.meal_date, row.dish_name)

  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    const key = iso(d)
    return {
      day: new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d).toUpperCase(),
      date: String(d.getDate()),
      iso: key,
  taskItems: (tasksByDay.get(key) ?? []).sort((a, b) => Number(a.done) - Number(b.done)),
  tasks: tasksByDay.get(key)?.length ?? 0,
  meal: dinners.get(key) ?? null,
      isToday: key === todayIso,
    }
  })
}

const STARTER_TEMPLATES = [
  { title: 'Load dishwasher', frequency: 'daily', due_time: null },
  { title: 'Wash utensils', frequency: 'daily', due_time: '21:00' },
  { title: 'Laundry \u00b7 washing', frequency: 'weekly', weekday: 5, due_time: '12:00' },
  { title: 'Dust & vacuum', frequency: 'flexible_weekend', due_time: null },
]

const STARTER_MEALS = [
  'Rajma chawal',
  'Pasta primavera',
  'Dal, rice & bhindi',
  'Aloo paratha',
  'Takeaway night',
  'Chole & salad',
  'Roast vegetables',
]

export async function seedStarterData(supabase: DB, adminId: string, today: Date): Promise<void> {
  const { count } = await supabase.from('chore_templates').select('id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return

  const { data: members } = await supabase.from('profiles').select('id').order('created_at', { ascending: true })
  const assignees = (members ?? []).map((member) => member.id)

  const { data: templates } = await supabase
    .from('chore_templates')
    .insert(
      STARTER_TEMPLATES.map((t) => ({
        title: t.title,
        frequency: t.frequency,
        weekday: (t as any).weekday ?? null,
        due_time: t.due_time,
        active: true,
        configuration_complete: true,
        created_by: adminId,
      })),
    )
    .select('id, title')

  if (templates && templates.length > 0) {
    const todayIso = iso(today)
    const occurrenceRows = templates.flatMap((template: any) =>
      (assignees.length > 0 ? assignees : [adminId]).map((assigneeId) => ({
        template_id: template.id,
        assigned_to: assigneeId,
        occurrence_date: todayIso,
      })),
    )
    await supabase.from('chore_occurrences').insert(occurrenceRows)
  }

  const start = weekStart(today)
  await supabase.from('meals').insert(
    STARTER_MEALS.map((dish, i) => ({
      week_start: iso(start),
      meal_date: iso(addDays(start, i)),
      slot: 'dinner',
      dish_name: dish,
      responsible_profile_id: adminId,
      created_by: adminId,
    })),
  )

  await supabase.from('shopping_items').insert([
    { label: 'Milk', quantity: '2 litres', added_by: adminId },
    { label: 'Atta', quantity: '5 kg', added_by: adminId },
    { label: 'Coriander', quantity: '1 bunch', added_by: adminId },
  ])
}
