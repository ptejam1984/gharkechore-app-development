'use client'

import { useEffect, useState, useTransition } from 'react'
import { saveFamilyCalendar } from '@/app/actions'

type Calendar = { id: string; summary: string; primary?: boolean; accessRole?: string }

export default function CalendarSettings({ connected, selectedCalendarId }: { connected: boolean; selectedCalendarId: string | null }) {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [selected, setSelected] = useState(selectedCalendarId ?? '')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [needsAuthorization, setNeedsAuthorization] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!connected) return
    fetch('/api/calendar/calendars').then(async (response) => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setNeedsAuthorization(Boolean(data.requiresAuthorization || response.status === 401))
        throw new Error(data.error ?? 'Unable to load calendars')
      }
      return data
    }).then((data) => setCalendars(data.calendars ?? [])).catch((reason: Error) => setError(reason.message))
  }, [connected])

  function save() {
    startTransition(async () => {
      await saveFamilyCalendar(selected)
      setStatus('Family calendar saved')
    })
  }

  return <section className="mt-6 rounded-[24px] border border-[#e8e6de] bg-white p-6 shadow-[0_8px_30px_rgba(54,67,61,0.04)]">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#967d54]">Calendar sync</p><h2 className="mt-1 font-serif text-2xl font-semibold">Family calendar</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#6f7973]">Choose the shared Google Calendar. New tasks will be added here and to the assigned person’s calendar.</p></div><span className="rounded-full bg-[#e8f0eb] px-3 py-1 text-xs font-bold text-[#244c46]">{selected ? 'Selected' : 'Not selected'}</span></div>
    {!connected ? <div className="mt-5 rounded-xl bg-[#fbfaf6] p-4"><p className="text-sm leading-6 text-[#6f7973]">Connect the admin Google account that has access to the shared family calendar, then return here to choose it.</p><a href="/api/calendar/connect?returnTo=%2Fadmin" className="mt-3 inline-flex rounded-xl bg-[#244c46] px-4 py-2 text-sm font-bold text-white">Connect Google Calendar</a></div> : <div className="mt-5 flex flex-col gap-3 sm:flex-row"><select value={selected} onChange={(event) => setSelected(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-[#e2e5df] bg-white px-3 text-sm outline-none focus:border-[#5a9b8c]"><option value="">Select a shared calendar</option>{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.summary}{calendar.primary ? ' (Primary)' : ''}</option>)}</select><button onClick={save} disabled={!selected || pending} className="rounded-xl bg-[#244c46] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">Save calendar</button></div>}
    {status && <p className="mt-3 text-xs font-semibold text-[#397568]">{status}</p>}
    {error && <div className="mt-3 rounded-xl bg-[#fff4ed] p-3 text-xs font-semibold text-[#a65f43]"><p>{error}</p>{needsAuthorization && <a href="/api/calendar/connect?returnTo=%2Fadmin" className="mt-3 inline-flex rounded-lg bg-[#244c46] px-3 py-2 text-white">Authorize this admin Google account</a>}</div>}
  </section>
}
