import { startAuthorization } from '@vercel/connect'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/gharkechore-family-calendar'
const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']

async function getCallbackOrigin() {
  if (process.env.NODE_ENV !== 'production' && process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  if (!host) throw new Error('Unable to determine callback origin')
  return `${protocol}://${host}`
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const callbackUrl = `${await getCallbackOrigin()}/api/calendar/callback`
  const authorization = await startAuthorization(CONNECTOR, {
    subject: { type: 'user', id: user.id, issuer: 'supabase' },
    scopes: SCOPES,
  }, { callbackUrl })

  return NextResponse.redirect(authorization.url)
}
