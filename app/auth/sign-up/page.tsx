'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '../auth-shell'

export default function SignUpPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: { display_name: displayName.trim() },
      },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    router.push('/auth/sign-up-success')
  }

  return (
    <AuthShell title="Join the home" subtitle="Create your account to share the load.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#87918a]">Your name</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-12 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-4 text-sm outline-none focus:border-[#5a9b8c]"
            placeholder="Prashant"
          />
        </label>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border border-[#e2e5df] bg-[#fbfcf9] px-4 text-sm outline-none focus:border-[#5a9b8c]"
            placeholder="At least 6 characters"
          />
        </label>
        {error && <p className="rounded-lg bg-[#f8e0e0] px-3 py-2 text-sm text-[#9a4a4a]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 rounded-xl bg-[#244c46] text-sm font-bold text-white hover:bg-[#1c3d38] disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#87918a]">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-[#244c46] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
