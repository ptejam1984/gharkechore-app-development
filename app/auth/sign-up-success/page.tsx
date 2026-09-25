import Link from 'next/link'
import { AuthShell } from '../auth-shell'

export default function SignUpSuccessPage() {
  return (
    <AuthShell title="Check your inbox" subtitle="One quick step to finish setting up.">
      <p className="text-sm leading-relaxed text-[#5b655f]">
        We&apos;ve sent you a confirmation link. Please confirm your email address, then come back
        and sign in to start sharing chores with the family.
      </p>
      <Link
        href="/auth/login"
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#244c46] text-sm font-bold text-white hover:bg-[#1c3d38]"
      >
        Back to sign in
      </Link>
    </AuthShell>
  )
}
