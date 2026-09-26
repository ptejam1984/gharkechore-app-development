import Link from 'next/link'
import { AuthShell } from '../auth-shell'

export default function SignUpSuccessPage() {
  return (
    <AuthShell title="Check your inbox" subtitle="One quick step to finish setting up.">
      <p className="text-sm leading-relaxed text-muted-foreground">
        We&apos;ve sent you a confirmation link. Please confirm your email address, then come back
        and sign in to start sharing chores with the family.
      </p>
      <Link
        href="/auth/login"
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary"
      >
        Back to sign in
      </Link>
    </AuthShell>
  )
}
