import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@/lib/supabase/server'
import Dashboard from './dashboard'
import {
  addDays,
  formatLongDate,
  getMembers,
  getPendingChanges,
  getShopping,
  getStagedShoppingItems,
  getTodayChores,
  getTodayMeals,
  getWeek,
  getWeekMealPlan,
  greeting,
  iso,
  londonToday,
  seedStarterData,
  type Member,
} from '@/lib/data'

export default async function Page({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const supabase = await createClient()
  const { week: weekParam } = await searchParams
  const weekOffset = Math.max(-52, Math.min(52, Number.parseInt(weekParam ?? '0', 10) || 0))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, role, theme, notifications_enabled, google_calendar_connected, family_calendar_id')
    .eq('id', user.id)
    .single()

  const resolvedProfile: Member = profile ?? {
    id: user.id,
    display_name: (user.email ?? 'Friend').split('@')[0],
    role: 'member',
  }

  const today = londonToday()
  const todayIso = iso(today)

  if (resolvedProfile.role === 'admin') {
    await seedStarterData(supabase, resolvedProfile.id, today)
  }

  const mealWeekDate = addDays(today, weekOffset * 7)

  const [members, chores, meals, shopping, stagedShopping, week, weekMeals, pendingChanges] = await Promise.all([
    getMembers(supabase),
    getTodayChores(supabase, todayIso, user.id),
    getTodayMeals(supabase, todayIso),
    getShopping(supabase),
    getStagedShoppingItems(supabase),
    getWeek(supabase, today, user.id, weekOffset),
    getWeekMealPlan(supabase, mealWeekDate),
    getPendingChanges(supabase),
  ])

  return (
    <Dashboard
      profile={resolvedProfile}
      members={members}
      chores={chores}
      meals={meals}
      shopping={shopping}
      stagedShoppingCount={stagedShopping.length}
      week={week}
      weekMeals={weekMeals}
      weekOffset={weekOffset}
      pendingChanges={pendingChanges}
      dateLabel={formatLongDate(today)}
      greeting={greeting()}
    />
  )
}
