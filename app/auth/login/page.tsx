'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flower2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '../auth-shell'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes('confirm')
          ? 'Please confirm your email before signing in.'
          : 'Invalid email or password.',
      )
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <AuthShell
      title="Welcome home"
      subtitle="Sign in to see today&apos;s chores and meals."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#87918a]">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-4 text-sm outline-none focus:border-[#5a9b8c]"
            placeholder="you@family.com"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#87918a]">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-4 text-sm outline-none focus:border-[#5a9b8c]"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="rounded-lg bg-[#f8e0e0] px-3 py-2 text-sm text-[#9a4a4a]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 rounded-xl bg-[#244c46] text-sm font-bold text-white hover:bg-[#1c3d38] disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#87918a]">
        New to the family?{' '}
        <Link href="/auth/sign-up" className="font-semibold text-[#244c46] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
