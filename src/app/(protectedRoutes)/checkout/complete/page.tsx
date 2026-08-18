'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  activateSubscription,
  activateCustomVoiceAddon,
} from '@/actions/subscription'

const REDIRECT_DELAY_MS = 2500

export default function CheckoutCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Whop sends checkout_status=success on success
  const checkoutStatus = searchParams.get('checkout_status')
  const next = searchParams.get('next')

  const success = checkoutStatus === 'success'
  const destination = next && next.startsWith('/') ? next : '/home'

  const [countdown, setCountdown] = useState(
    Math.round(REDIRECT_DELAY_MS / 1000)
  )

  useEffect(() => {
    if (!success) return

    // Immediately activate the subscription / addon in DB for the logged-in user
    const syncStatus = async () => {
      try {
        if (next?.includes('voice')) {
          await activateCustomVoiceAddon()
        } else {
          await activateSubscription()
        }
      } catch (err) {
        console.error('Error auto-activating subscription:', err)
      }
    }

    syncStatus()

    // Count down display
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)

    // Flush the Next.js router cache so the layout re-fetches the user
    // from DB (subscription=true) before we navigate.
    const timeout = setTimeout(() => {
      router.refresh()
      router.push(destination)
    }, REDIRECT_DELAY_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [success, destination, next, router])

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-6 p-8 rounded-2xl border border-border bg-background/60 backdrop-blur-md shadow-xl">
        {success ? (
          <>
            {/* Animated checkmark */}
            <div className="relative flex items-center justify-center">
              <div className="absolute size-24 rounded-full bg-emerald-500/10 animate-ping" />
              <CheckCircle2 className="relative size-14 text-emerald-500" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Payment successful!
              </h1>
              <p className="text-sm text-muted-foreground">
                Your plan is now active. You&apos;ll be redirected automatically.
              </p>
            </div>

            {/* Countdown pill */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <Loader2 className="size-4 animate-spin" />
              Redirecting in {countdown}s…
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href={destination}>Go now →</Link>
            </Button>
          </>
        ) : (
          <>
            <XCircle className="size-14 text-destructive" />

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Checkout wasn&apos;t completed
              </h1>
              <p className="text-sm text-muted-foreground">
                The payment was cancelled or failed — no charge was made. You
                can try again anytime.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/home">Back to dashboard</Link>
              </Button>
              <Button asChild className="flex-1">
                {/* Go back so they can retry from the same page */}
                <Link href={destination ?? '/home'}>Try again</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}