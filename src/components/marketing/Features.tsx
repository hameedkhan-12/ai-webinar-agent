import {
  Webcam,
  PhoneCall,
  Brain,
  Mic,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Webcam,
    title: 'Live webinars, built in',
    description:
      'Host a real live webinar - chat, attendee tracking, and CTAs - without stitching together a separate streaming tool.',
  },
  {
    icon: PhoneCall,
    title: 'AI voice call handoff',
    description:
      'When an attendee clicks "Book a Call", they talk to an AI voice agent live, in the browser, instead of waiting on a human.',
  },
  {
    icon: Brain,
    title: 'Context-aware opening lines',
    description:
      'The agent\u2019s first line is built from what each attendee actually did - chat messages, watch time, and CTA clicks - not a cold script.',
  },
  {
    icon: Mic,
    title: 'Custom voice cloning',
    description:
      'Clone your own voice (or a guest speaker\u2019s) so your AI agent sounds like a real person, with a stock-voice fallback if it ever fails.',
  },
  {
    icon: BarChart3,
    title: 'Engagement tracking',
    description:
      'Every chat message, watch-time heartbeat, and CTA click is logged per attendee, so nothing your agent says is a guess.',
  },
  {
    icon: ShieldCheck,
    title: 'Simple, transparent billing',
    description:
      'One platform subscription, one optional voice-cloning add-on. Checkout and payouts run through Whop - no hidden fees.',
  },
]

const Features = () => {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to close from a webinar
        </h2>
        <p className="mt-4 text-muted-foreground">
          From the live room to the follow-up call, one platform handles
          attendance, engagement, and conversion.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-border bg-card/50 p-6 transition-colors hover:border-primary/40"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold tracking-tight">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features