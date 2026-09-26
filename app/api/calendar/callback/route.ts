import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ google_calendar_connected: true }).eq('id', user.id)
  }
  return NextResponse.redirect(new URL('/settings?calendar=connected', request.url))
}
