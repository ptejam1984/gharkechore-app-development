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
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-success"
            placeholder="you@family.com"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-success"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to the family?{' '}
        <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
