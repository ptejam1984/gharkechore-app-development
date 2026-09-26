import { getToken } from '@vercel/connect'

const CONNECTOR = 'google/gharkechore-family-calendar'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

type CalendarEventInput = {
  title: string
  date: string
  dueAt: string | null
}

export async function createPersonalCalendarEvent(userId: string, input: CalendarEventInput) {
  const token = await getToken(CONNECTOR, {
    subject: { type: 'user', id: userId, issuer: 'supabase' },
    scopes: [CALENDAR_SCOPE],
  })
  const start = input.dueAt ? new Date(input.dueAt) : new Date(`${input.date}T09:00:00+01:00`)
  const end = new Date(start.getTime() + 30 * 60 * 1000)
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: input.title,
      description: 'GharKeChore task',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: { useDefault: true },
    }),
  })
  if (!response.ok) throw new Error(`Google Calendar event failed: ${response.status}`)
  const event = await response.json() as { id?: string }
  return event.id ?? null
}
