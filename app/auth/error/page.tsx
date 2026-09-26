import Link from 'next/link'
import { AuthShell } from '../auth-shell'

export default function AuthErrorPage() {
  return (
    <AuthShell title="Something went wrong" subtitle="We couldn&apos;t complete that request.">
      <p className="text-sm leading-relaxed text-[#5b655f]">
        Your sign-in link may have expired or already been used. Please try signing in again.
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
