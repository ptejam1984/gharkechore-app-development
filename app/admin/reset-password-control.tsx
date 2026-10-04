'use client'

import { useState, useTransition } from 'react'
import { resetMemberPassword } from '../actions'

export default function ResetPasswordControl({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function close() {
    setOpen(false)
    setPassword('')
    setError(null)
    setSuccess(false)
  }

  function submit() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await resetMemberPassword(memberId, password)
        setSuccess(true)
        setPassword('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reset password.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
      >
        Reset password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-[20px] border border-border bg-white p-6 shadow-xl">
            <h3 className="font-serif text-xl font-semibold">Reset password</h3>
            <p className="mt-1 text-sm text-muted-foreground">Set a new password for {memberName}.</p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="mt-1.5 w-full rounded-xl border border-border bg-sidebar px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              autoFocus
            />

            {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
            {success && <p className="mt-2 text-sm font-medium text-success">Password updated.</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={close} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-mint">
                Close
              </button>
              <button
                onClick={submit}
                disabled={pending || password.length < 8}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Save password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
