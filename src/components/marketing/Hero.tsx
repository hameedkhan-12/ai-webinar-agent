'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, PhoneCall, Sparkles } from 'lucide-react'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.25, 0.4, 0.25, 1] },
  }),
}

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--accent-primary)_12%,transparent),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-rose-500/10 blur-3xl" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          >
            <Sparkles className="h-3 w-3" />
            AI voice agents that pick up where your webinar left off
          </Badge>
        </motion.div>

        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          Turn webinar attendees into
          <span className="bg-gradient-to-r from-indigo-400 via-primary to-rose-400 bg-clip-text text-transparent">
            {' '}
            booked calls
          </span>
          , automatically
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
        >
          Run live webinars, and when an attendee clicks &quot;Book a Call&quot;,
          hand them off to an AI voice agent that already knows what they
          chatted about, how long they watched, and what they clicked - no
          human required, no cold opener.
        </motion.p>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <SignedOut>
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign in
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
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-16 w-full max-w-5xl"
        >
          <div className="overflow-hidden rounded-2xl border border-accent-primary/30 bg-card shadow-2xl shadow-black/20">
            <Image
              src="/preview.png"
              alt="Voxinar dashboard preview"
              width={1024}
              height={475}
              className="w-full h-auto"
              priority
            />
          </div>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-16 w-full max-w-3xl"
        >
          <div className="rounded-2xl border border-border bg-card/60 p-4 text-left shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <span className="h-3 w-3 rounded-full bg-rose-400/70" />
              <span className="h-3 w-3 rounded-full bg-amber-400/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-muted-foreground">
                Live call handoff
              </span>
            </div>
            <div className="grid gap-4 pt-4 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PhoneCall className="size-5" />
              </div>
              <div className="space-y-2 text-left">
                <p className="text-xs font-medium text-muted-foreground">
                  AI agent - opening line
                </p>
                <p className="text-sm leading-relaxed sm:text-base">
                  &quot;Hey Sarah, thanks for sticking around for the full
                  session and asking about onboarding timelines in the chat -
                  let&apos;s pick up right there.&quot;
                </p>
                <p className="text-xs text-muted-foreground">
                  Built from Sarah&apos;s real watch time, chat messages, and
                  CTA clicks during the webinar - not a generic script.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero