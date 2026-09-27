import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@/lib/supabase/server'
import Dashboard from './dashboard'
import {
  formatLongDate,
  getMembers,
  getPendingChanges,
  getShopping,
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

export default async function Page() {
  const supabase = await createClient()

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

  const [members, chores, meals, shopping, week, weekMeals, pendingChanges] = await Promise.all([
    getMembers(supabase),
    getTodayChores(supabase, todayIso, user.id),
    getTodayMeals(supabase, todayIso),
    getShopping(supabase),
    getWeek(supabase, today, user.id),
    getWeekMealPlan(supabase, today),
    getPendingChanges(supabase),
  ])

  return (
    <Dashboard
      profile={profile as Member}
      members={members}
      chores={chores}
      meals={meals}
      shopping={shopping}
      week={week}
      weekMeals={weekMeals}
      pendingChanges={pendingChanges}
      dateLabel={formatLongDate(today)}
      greeting={greeting()}
    />
  )
}
