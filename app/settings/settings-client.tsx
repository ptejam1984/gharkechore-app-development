'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { ArrowLeft, Palette, Save, UserRound } from 'lucide-react'
import { updateProfilePreferences } from '@/app/actions'
import { CalendarDays } from 'lucide-react'
import type { Member } from '@/lib/data'

export default function SettingsClient({ member }: { member: Member }) {
  const [displayName, setDisplayName] = useState(member.display_name)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(member.theme ?? 'system')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark))
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  function save() {
    startTransition(async () => {
      await updateProfilePreferences({
        displayName,
        theme,
        notificationsEnabled: Boolean(member.notifications_enabled),
      })
      document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
      document.documentElement.classList.toggle('light', theme === 'light')
      setMessage('Settings saved')
      window.setTimeout(() => setMessage(''), 2500)
    })
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-success hover:text-primary"><ArrowLeft className="size-4" /> Back to today</Link>
        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Your space</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-primary">Settings</h1>
          <p className="mt-2 leading-6 text-muted-foreground">Make GharKeChore feel like yours.</p>
        </header>

        <section className="mt-8 rounded-[28px] border border-border bg-white p-6 shadow-[0_10px_30px_rgba(54,67,61,0.05)]">
          <div className="flex items-center gap-3"><UserRound className="size-5 text-success" /><h2 className="text-lg font-bold">Profile</h2></div>
          <label className="mt-6 block text-sm font-bold text-foreground">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 font-normal outline-none focus:border-success" /></label>
        </section>

        <section className="mt-5 rounded-[28px] border border-border bg-white p-6 shadow-[0_10px_30px_rgba(54,67,61,0.05)]">
          <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 text-success" /><div><h2 className="text-lg font-bold">Google Calendar</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Connect your calendar so task reminders can be delivered by Google Calendar.</p></div></div><a href="/api/calendar/connect" className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/85">{member.google_calendar_connected ? 'Connected' : 'Connect'}</a></div>
          {member.google_calendar_connected && <p className="mt-3 text-xs font-semibold text-mint">Your Google account is connected. Calendar event mirroring will use your private account.</p>}
          {member.family_calendar_id && <p className="mt-3 rounded-xl bg-accent p-3 text-xs font-semibold text-mint">Shared family calendar is selected by the admin. New tasks assigned to you will also be added there. Your personal calendar connection is separate.</p>}
        </section>

        <section className="mt-5 rounded-[28px] border border-border bg-white p-6 shadow-[0_10px_30px_rgba(54,67,61,0.05)]">
          <div className="flex items-center gap-3"><Palette className="size-5 text-success" /><h2 className="text-lg font-bold">Appearance</h2></div>
          <div className="mt-5 grid grid-cols-3 gap-2">{(['system', 'light', 'dark'] as const).map((option) => <button type="button" key={option} onClick={() => setTheme(option)} className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize ${theme === option ? 'border-success bg-accent text-primary' : 'border-border text-muted-foreground'}`}>{option}</button>)}</div>
        </section>

        <div className="mt-6 flex items-center justify-end gap-4 pb-8"><span className="text-sm font-semibold text-success">{message}</span><button onClick={save} disabled={pending || !displayName.trim()} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary disabled:opacity-50"><Save className="size-4" />{pending ? 'Saving…' : 'Save settings'}</button></div>
      </div>
    </main>
  )
}

function SettingsLoading() { return null }
