import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

const CtaSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-16 text-center sm:px-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Stop losing warm leads to a cold callback queue
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Set up your first webinar and AI call agent in minutes.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <SignedOut>
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/home">
              <Button size="lg" className="gap-2">
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  )
}

export default CtaSection