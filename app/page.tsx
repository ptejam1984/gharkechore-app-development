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
    .select('id, display_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    profile = {
      id: user.id,
      display_name: (user.email ?? 'Friend').split('@')[0],
      role: 'member',
    } as Member
  }

  const today = londonToday()
  const todayIso = iso(today)

  if (profile.role === 'admin') {
    await seedStarterData(supabase, profile.id, today)
  }

  const [members, chores, meals, shopping, week, pendingChanges] = await Promise.all([
    getMembers(supabase),
    getTodayChores(supabase, todayIso, user.id),
    getTodayMeals(supabase, todayIso),
    getShopping(supabase),
    getWeek(supabase, today, user.id),
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
      pendingChanges={pendingChanges}
      dateLabel={formatLongDate(today)}
      greeting={greeting()}
    />
  )
}
