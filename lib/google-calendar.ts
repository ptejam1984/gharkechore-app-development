import { getToken } from '@vercel/connect'

const CONNECTOR = 'google/gharkechore-family-calendar'
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']

type CalendarEventInput = {
  title: string
  date: string
  dueAt: string | null
}

export async function createCalendarEvent(userId: string, calendarId: string, input: CalendarEventInput) {
  const token = await getToken(CONNECTOR, {
    subject: { type: 'user', id: userId },
    scopes: CALENDAR_SCOPES,
  })
  const start = input.dueAt ? new Date(input.dueAt) : new Date(`${input.date}T09:00:00+01:00`)
  const end = new Date(start.getTime() + 30 * 60 * 1000)
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
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
  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Google Calendar event failed: ${response.status} ${details.slice(0, 300)}`)
  }
  const event = await response.json() as { id?: string }
  return event.id ?? null
}
