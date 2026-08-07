import { Webcam, MousePointerClick, PhoneCall } from 'lucide-react'

const STEPS = [
  {
    icon: Webcam,
    title: 'Host your live webinar',
    description:
      'Run your session with live chat and attendee tracking. Every message, watch-time interval, and CTA click is captured as it happens.',
  },
  {
    icon: MousePointerClick,
    title: 'Attendee clicks a CTA',
    description:
      'They choose to buy now through your connected Whop checkout, or book a call - both without leaving the webinar room.',
  },
  {
    icon: PhoneCall,
    title: 'AI agent picks up with context',
    description:
      'For "Book a Call", an AI voice agent - optionally in your own cloned voice - opens the conversation already knowing what that attendee cared about.',
  },
]

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="border-y border-border/60 bg-muted/20 py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three steps from &quot;attendee joined&quot; to &quot;call booked&quot;.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative text-center sm:text-left">
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {index + 1}
                </div>
                <step.icon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks