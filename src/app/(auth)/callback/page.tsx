import { onAuthenticateUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

const AuthCallbackPage = async () => {
  const auth = await onAuthenticateUser()

  if (auth.status === 200 || auth.status === 201) {
    redirect('/home')
  }

  if (auth.status === 403) {
    redirect('/sign-in')
  }

  // Display error diagnostic instead of looping silently to root
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full p-6 rounded-2xl border border-border/80 bg-card shadow-xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Authentication Error</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {auth.error || auth.message || 'Unable to sync user with database.'}
        </p>
        <p className="text-xs text-muted-foreground/70 bg-secondary/50 p-3 rounded-lg border border-border/40 text-left font-mono">
          Tip: Ensure your DATABASE_URL environment variable is properly set in Vercel and your PostgreSQL database is reachable.
        </p>
        <div className="pt-2 flex gap-3">
          <Link
            href="/callback"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthCallbackPage
