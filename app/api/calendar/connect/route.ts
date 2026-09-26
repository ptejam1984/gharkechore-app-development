import { startAuthorization } from '@vercel/connect'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/gharkechore-family-calendar'
const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const callbackUrl = new URL('/api/calendar/callback', request.url).toString()
  const authorization = await startAuthorization(CONNECTOR, {
    subject: { type: 'user', id: user.id, issuer: 'supabase' },
    scopes: SCOPES,
  }, { callbackUrl })

  return NextResponse.redirect(authorization.url)
}
