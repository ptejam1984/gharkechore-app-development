import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('profiles')
    .select('id, display_name, role, avatar_key, theme, notifications_enabled')
    .eq('id', user.id)
    .single()

  if (!member) redirect('/')
  return <SettingsClient member={member} />
}
