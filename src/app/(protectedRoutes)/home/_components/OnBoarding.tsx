'use client'

import CheckCircle from '@/icons/CheckCircle'
import { onBoardingSteps } from '@/lib/data'
import Link from 'next/link'
import React from 'react'

const OnBoarding = () => {
  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-xl border border-border/50 bg-background/40 backdrop-blur-md min-w-[240px]">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Quick Onboarding Steps
      </span>
      <div className="space-y-2">
        {onBoardingSteps.map((step) => (
          <Link
            key={step.id}
            href={step.link || '/webinars'}
            className="flex items-center gap-2.5 text-xs text-foreground hover:text-accent-primary transition-colors group"
          >
            <div className="shrink-0 text-emerald-500">
              <CheckCircle />
            </div>
            <span className="font-medium group-hover:underline decoration-accent-primary/40 underline-offset-2">
              {step.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default OnBoarding
