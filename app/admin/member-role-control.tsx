'use client'

import { useTransition } from 'react'
import { updateMemberRole } from '../actions'

export default function MemberRoleControl({ memberId, role }: { memberId: string; role: string }) {
  const [pending, startTransition] = useTransition()
  const isAdmin = role === 'admin'

  return (
    <button
      onClick={() => startTransition(async () => { await updateMemberRole(memberId, isAdmin ? 'member' : 'admin') })}
      disabled={pending}
      className={`rounded-full px-2.5 py-1 text-xs font-bold transition disabled:opacity-50 ${
        isAdmin
          ? 'bg-secondary text-secondary-foreground hover:bg-destructive/15 hover:text-destructive'
          : 'bg-muted text-muted-foreground hover:bg-success/15 hover:text-success'
      }`}
    >
      {pending ? 'Saving…' : isAdmin ? 'Remove admin' : 'Make admin'}
    </button>
  )
}
