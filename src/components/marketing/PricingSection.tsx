import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLATFORM_PRICE = 29
const VOICE_ADDON_PRICE = 15

const PLATFORM_FEATURES = [
  'Unlimited live webinars',
  'Live chat & attendee engagement tracking',
  'AI voice call handoff for every "Book a Call" click',
  'Context-aware call opening lines',
  'Whop-powered checkout for your own products',
]

const ADDON_FEATURES = [
  'Clone your voice, or a guest speaker\u2019s',
  'Upload or record a sample - no fine-tuning needed',
  'Automatic fallback to a stock voice if generation fails',
  'Billed separately, cancel anytime',
]

const PricingSection = () => {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple pricing, no surprises
        </h2>
        <p className="mt-4 text-muted-foreground">
          One subscription to run the platform. Voice cloning is an optional
          add-on for hosts who want it.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-primary/40 bg-card p-8 shadow-sm">
          <h3 className="font-semibold tracking-tight">
            Platform subscription
          </h3>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">
              ${PLATFORM_PRICE}
            </span>
            <span className="text-sm text-muted-foreground">/month</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {PLATFORM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className="mt-8">
            <Button className="w-full">Get started</Button>
          </Link>
        </div>

        <div className="flex flex-col rounded-2xl border border-border bg-card/60 p-8">
          <h3 className="font-semibold tracking-tight">
            Custom voice cloning
          </h3>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">
              ${VOICE_ADDON_PRICE}
            </span>
            <span className="text-sm text-muted-foreground">/month add-on</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {ADDON_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className="mt-8">
            <Button variant="outline" className="w-full">
              Add it after signing up
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PricingSection