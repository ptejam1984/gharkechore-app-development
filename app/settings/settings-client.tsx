'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowLeft, Bell, Check, Leaf, Moon, Palette, Save, Star, Sun, UserRound } from 'lucide-react'
import { updateProfilePreferences } from '@/app/actions'
import { CalendarDays } from 'lucide-react'
import type { Member } from '@/lib/data'

const avatars = [
  { key: 'leaf', label: 'Leaf', icon: Leaf, className: 'bg-[#dceee5] text-[#35665c]' },
  { key: 'sun', label: 'Sun', icon: Sun, className: 'bg-[#f4e4bd] text-[#9a7334]' },
  { key: 'moon', label: 'Moon', icon: Moon, className: 'bg-[#dfe3f4] text-[#56618e]' },
  { key: 'flower', label: 'Flower', icon: Star, className: 'bg-[#f2dce5] text-[#9a5272]' },
  { key: 'star', label: 'Star', icon: Star, className: 'bg-[#e8dfc9] text-[#806833]' },
  { key: 'home', label: 'Home', icon: UserRound, className: 'bg-[#d9e8ed] text-[#466f7d]' },
]

export default function SettingsClient({ member }: { member: Member }) {
  const [displayName, setDisplayName] = useState(member.display_name)
  const [avatarKey, setAvatarKey] = useState(member.avatar_key ?? 'leaf')
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(member.theme ?? 'system')
  const [notifications, setNotifications] = useState(Boolean(member.notifications_enabled))
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  function toggleNotifications() {
    if (!notifications && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setNotifications(permission === 'granted')
      })
    } else {
      setNotifications(false)
    }
  }

  function save() {
    startTransition(async () => {
      await updateProfilePreferences({ displayName, avatarKey, theme, notificationsEnabled: notifications })
      document.documentElement.dataset.theme = theme
      setMessage('Settings saved')
      window.setTimeout(() => setMessage(''), 2500)
    })
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] px-5 py-8 text-[#263a35] sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5a8177] hover:text-[#244c46]"><ArrowLeft className="size-4" /> Back to today</Link>
        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b978f]">Your space</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-[#244c46]">Settings</h1>
          <p className="mt-2 leading-6 text-[#6f7973]">Make GharKeChore feel like yours.</p>
        </header>

        <section className="mt-8 rounded-[28px] border border-[#e5e3db] bg-white p-6 shadow-[0_10px_30px_rgba(54,67,61,0.05)]">
          <div className="flex items-center gap-3"><UserRound className="size-5 text-[#5a8177]" /><h2 className="text-lg font-bold">Profile</h2></div>
          <label className="mt-6 block text-sm font-bold text-[#52615a]">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} className="mt-2 h-12 w-full rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-4 font-normal outline-none focus:border-[#5a9b8c]" /></label>
          <div className="mt-6"><p className="text-sm font-bold text-[#52615a]">Choose an avatar</p><div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">{avatars.map(({ key, label, icon: Icon, className }) => <button type="button" key={key} onClick={() => setAvatarKey(key)} className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition ${avatarKey === key ? 'border-[#5a9b8c] bg-[#f0f7f2]' : 'border-transparent bg-[#f7f7f2] hover:border-[#d9e7df]'}`}><span className={`flex size-12 items-center justify-center rounded-full ${className}`}><Icon className="size-6" /></span><span className="text-xs font-semibold text-[#6f7973]">{label}</span></button>)}</div></div>
        </section>

        <section className="mt-5 rounded-[28px] border border-[#e5e3db] bg-white p-6 shadow-[0_10px_30px_rgba(54,67,61,0.05)]">
          <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 text-[#5a8177]" /><div><h2 className="text-lg font-bold">Google Calendar</h2><p className="mt-1 text-sm leading-6 text-[#7b867f]">Connect your calendar so task reminders can be delivered by Google Calendar.</p></div></div><a href="/api/calendar/connect" className="shrink-0 rounded-xl bg-[#244c46] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c3d38]">{member.google_calendar_connected ? 'Connected' : 'Connect'}</a></div>
          {member.google_calendar_connected && <p className="mt-3 text-xs font-semibold text-[#397568]">Your Google account is connected. Calendar event mirroring will use your private account.</p>}
        </section>

        <section className="mt-5 rounded-[28px] border border-[#e5e3db] bg-white p-6 shadow-[0_10px_30px_rgba(54,67,61,0.05)]">
          <div className="flex items-center gap-3"><Palette className="size-5 text-[#5a8177]" /><h2 className="text-lg font-bold">Appearance</h2></div>
          <div className="mt-5 grid grid-cols-3 gap-2">{(['system', 'light', 'dark'] as const).map((option) => <button type="button" key={option} onClick={() => setTheme(option)} className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize ${theme === option ? 'border-[#5a9b8c] bg-[#eaf3ed] text-[#244c46]' : 'border-[#e5e3db] text-[#6f7973]'}`}>{option}</button>)}</div>
        </section>

        <section className="mt-5 rounded-[28px] border border-[#e5e3db] bg-white p-6 shadow-[0_10px_30px_rgba(54,67,61,0.05)]">
          <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><Bell className="mt-0.5 size-5 text-[#5a8177]" /><div><h2 className="text-lg font-bold">Task notifications</h2><p className="mt-1 text-sm leading-6 text-[#7b867f]">Allow this installed Android app to notify you about upcoming tasks.</p></div></div><button type="button" role="switch" aria-checked={notifications} onClick={toggleNotifications} className={`relative h-7 w-12 rounded-full transition ${notifications ? 'bg-[#5a9b8c]' : 'bg-[#d9ddd7]'}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${notifications ? 'left-6' : 'left-1'}`} /></button></div>
          {'Notification' in window && Notification.permission === 'denied' && <p className="mt-4 rounded-xl bg-[#fff3ed] p-3 text-xs font-semibold text-[#a45f48]">Notifications are blocked in Android settings. Re-enable them in your browser or installed app settings.</p>}
        </section>

        <div className="mt-6 flex items-center justify-end gap-4 pb-8"><span className="text-sm font-semibold text-[#5a8177]">{message}</span><button onClick={save} disabled={pending || !displayName.trim()} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#244c46] px-5 text-sm font-bold text-white hover:bg-[#1c3d38] disabled:opacity-50"><Save className="size-4" />{pending ? 'Saving…' : 'Save settings'}</button></div>
      </div>
    </main>
  )
}

function SettingsLoading() { return null }
