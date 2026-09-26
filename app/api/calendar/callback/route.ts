import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const callbackUrl = new URL(request.url)
  const returnTo = callbackUrl.searchParams.get('returnTo') === '/admin' ? '/admin' : '/settings'
  const error = callbackUrl.searchParams.get('error')
  if (error) return NextResponse.redirect(new URL(`${returnTo}?calendar=error&reason=${encodeURIComponent(error)}`, request.url))
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ google_calendar_connected: true }).eq('id', user.id)
  }
  return NextResponse.redirect(new URL(`${returnTo}?calendar=connected`, request.url))
}
