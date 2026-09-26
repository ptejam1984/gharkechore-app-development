'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { iso, londonToday, ukLocalDateTimeToIso, weekStart } from '@/lib/data'
import { createCalendarEvent } from '@/lib/google-calendar'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return { supabase, user }
}

export async function toggleOccurrence(occurrenceId: string, done: boolean) {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: occurrence } = await supabase
    .from('chore_occurrences')
    .select('assigned_to')
    .eq('id', occurrenceId)
    .single()

  if (!occurrence || (profile?.role !== 'admin' && occurrence.assigned_to !== user.id)) return

  await supabase
    .from('chore_occurrences')
    .update({
      status: done ? 'done' : 'open',
      completed_at: done ? new Date().toISOString() : null,
      completed_by: done ? user.id : null,
    })
    .eq('id', occurrenceId)
  revalidatePath('/')
}

export async function addChore(input: {
  title: string
  assigneeId: string
  frequency: 'once' | 'daily' | 'weekly'
  date: string
  time?: string
  weekdays?: number[]
}) {
  const clean = input.title.trim()
  if (!clean || !input.date) return
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const assigneeId = profile?.role === 'admin' ? input.assigneeId : user.id
  if (!assigneeId) return

  const frequency = input.frequency === 'once' ? 'on_demand' : input.frequency
  const { data: template } = await supabase.from('chore_templates').insert({
    title: clean, frequency, active: true, configuration_complete: true, created_by: user.id,
    due_time: input.time || null,
    weekday: input.frequency === 'weekly' ? (input.weekdays?.[0] ?? 1) : null,
  }).select('id').single()
  if (!template) return

  const start = new Date(`${input.date}T00:00:00`)
  const dates: string[] = []
  const limit = input.frequency === 'once' ? 1 : 30
  for (let i = 0; i < limit; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    if (input.frequency === 'daily' || input.frequency === 'once' || (input.weekdays ?? []).includes(day.getDay())) dates.push(iso(day))
  }
  const { data: occurrences } = await supabase.from('chore_occurrences').insert(dates.map((occurrenceDate) => ({
  template_id: template.id,
  assigned_to: assigneeId,
  occurrence_date: occurrenceDate,
  due_at: input.time ? ukLocalDateTimeToIso(occurrenceDate, input.time) : null,
  }))).select('id, occurrence_date, due_at')

  const [{ data: assignee }, { data: admin }] = await Promise.all([
    supabase.from('profiles').select('google_calendar_connected').eq('id', assigneeId).single(),
    supabase.from('profiles').select('id, family_calendar_id, google_calendar_connected').eq('role', 'admin').limit(1).maybeSingle(),
  ])
  if (assignee?.google_calendar_connected || admin?.family_calendar_id) {
    for (const occurrence of occurrences ?? []) {
      const eventInput = { title: clean, date: occurrence.occurrence_date, dueAt: occurrence.due_at }
      try {
        const [personalResult, familyResult] = await Promise.allSettled([
          assignee?.google_calendar_connected ? createCalendarEvent(assigneeId, 'primary', eventInput) : Promise.resolve(null),
          admin?.id && admin.family_calendar_id ? createCalendarEvent(admin.id, admin.family_calendar_id, eventInput) : Promise.resolve(null),
        ])
        const personalEventId = personalResult.status === 'fulfilled' ? personalResult.value : null
        const familyEventId = familyResult.status === 'fulfilled' ? familyResult.value : null
        const errors = [
          personalResult.status === 'rejected' ? `Personal calendar: ${personalResult.reason instanceof Error ? personalResult.reason.message : 'authorization failed'}` : null,
          familyResult.status === 'rejected' ? `Family calendar: ${familyResult.reason instanceof Error ? familyResult.reason.message : 'authorization failed'}` : null,
        ].filter(Boolean).join(' | ')
        const { error: syncError } = await supabase.from('chore_occurrences').update({ personal_google_event_id: personalEventId, family_google_event_id: familyEventId, google_calendar_sync_error: errors || null, google_calendar_synced_at: errors ? null : new Date().toISOString() }).eq('id', occurrence.id)
        if (syncError) throw syncError
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Google Calendar sync failed'
        console.error('[v0] Google Calendar task sync failed:', message)
        await supabase.from('chore_occurrences').update({ google_calendar_sync_error: message.slice(0, 500), google_calendar_synced_at: null }).eq('id', occurrence.id)
        // Calendar sync is best-effort: the chore must still be created when a
        // provider authorization has expired or the selected calendar is unavailable.
      }
    }
  }
  revalidatePath('/')
} 

export async function addOneOffChore(title: string) {
  return addChore({ title, assigneeId: '', frequency: 'once', date: iso(londonToday()) })
}

export async function updateMeal(slot: 'breakfast' | 'lunch' | 'dinner', dish: string, responsibleId: string | null) {
  const { supabase, user } = await requireUser()
  const cleanDish = dish.trim().slice(0, 160) || null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return
  const mealDate = iso(londonToday())
  const weekDate = iso(weekStart(londonToday()))
  const { error } = await supabase.from('meals').upsert({
    week_start: weekDate,
    meal_date: mealDate,
    slot,
    dish_name: cleanDish,
    responsible_profile_id: responsibleId || null,
    created_by: user.id,
  }, { onConflict: 'meal_date,slot' })
  if (error) throw new Error(`Unable to save meal: ${error.message}`)
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function addShoppingItem(label: string, quantity?: string) {
  const clean = label.trim()
  if (!clean) return
  const { supabase, user } = await requireUser()
  await supabase.from('shopping_items').insert({
    label: clean,
    quantity: quantity?.trim() || null,
    added_by: user.id,
  })
  revalidatePath('/')
}

export async function toggleShoppingItem(id: string, purchased: boolean) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('shopping_items')
    .update({ purchased, purchased_by: purchased ? user.id : null })
    .eq('id', id)
  revalidatePath('/')
}

export async function removeShoppingItem(id: string) {
  const { supabase } = await requireUser()
  await supabase.from('shopping_items').delete().eq('id', id)
  revalidatePath('/')
}

export async function updateCatalogTask(id: string, title: string) {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const cleanTitle = title.trim().slice(0, 120)
  if (profile?.role !== 'admin' || !cleanTitle) return
  await supabase.from('chore_templates').update({ title: cleanTitle }).eq('id', id)
  revalidatePath('/admin')
}

export async function saveFamilyCalendar(calendarId: string) {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' || !calendarId.trim()) return
  const { error } = await supabase.from('profiles').update({ family_calendar_id: calendarId.trim() }).eq('id', user.id)
  if (error) throw new Error(`Unable to save family calendar: ${error.message}`)
  revalidatePath('/admin')
}

export async function addCatalogTask(category: string, title: string) {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return
  const cleanCategory = category.trim().slice(0, 80) || 'General'
  const cleanTitle = title.trim().slice(0, 120)
  if (!cleanTitle) return
  await supabase.from('chore_templates').insert({
    title: cleanTitle,
    category: cleanCategory,
    frequency: 'on_demand',
    active: false,
    configuration_complete: true,
    created_by: user.id,
  })
  revalidatePath('/admin')
}

export async function updateProfilePreferences(input: {
  displayName: string
  avatarKey: string
  theme: 'system' | 'light' | 'dark'
  notificationsEnabled: boolean
}) {
  const { supabase, user } = await requireUser()
  const displayName = input.displayName.trim().slice(0, 100)
  if (!displayName || !['leaf', 'sun', 'moon', 'flower', 'star', 'home'].includes(input.avatarKey)) return
  await supabase.from('profiles').update({
    display_name: displayName,
    avatar_key: input.avatarKey,
    theme: input.theme,
    notifications_enabled: input.notificationsEnabled,
  }).eq('id', user.id)
  revalidatePath('/')
  revalidatePath('/settings')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
