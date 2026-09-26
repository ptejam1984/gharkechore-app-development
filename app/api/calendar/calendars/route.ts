import { getToken } from '@vercel/connect'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/gharkechore-family-calendar'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, google_calendar_connected').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const token = await getToken(CONNECTOR, { subject: { type: 'user', id: user.id }, scopes: [SCOPE] })
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!response.ok) return NextResponse.json({ error: `Google Calendar returned ${response.status}: ${(await response.text()).slice(0, 240)}` }, { status: 502 })
    const data = await response.json() as { items?: Array<{ id: string; summary: string; primary?: boolean; accessRole?: string }> }
    return NextResponse.json({ calendars: (data.items ?? []).map(({ id, summary, primary, accessRole }) => ({ id, summary, primary, accessRole })) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load calendars'
    const requiresAuthorization = message.toLowerCase().includes('authorization required') || message.toLowerCase().includes('authorize')
    return NextResponse.json({ error: message, requiresAuthorization }, { status: requiresAuthorization ? 401 : 502 })
  }
}
