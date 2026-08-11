'use client'

import Link from 'next/link'
import React from 'react'
import { ArrowUpRight } from 'lucide-react'

type Props = {
  link: string
  heading: string
  Icon: React.ReactNode
  description?: string
}

const FeatureCard = ({ heading, Icon, link, description }: Props) => {
  return (
    <Link
      href={link}
      className="p-6 rounded-2xl border border-border/60 bg-card hover:border-border/90 shadow-xs transition-all duration-200 flex flex-col justify-between space-y-6 group"
    >
      <div className="space-y-4">
        <div className="w-10 h-10 rounded-full border border-border/80 bg-background/50 flex items-center justify-center text-foreground group-hover:border-accent-primary/50 group-hover:text-accent-primary transition-all duration-200">
          {Icon}
        </div>
        <div>
          <h4 className="font-semibold text-base text-foreground group-hover:text-accent-primary transition-colors tracking-tight">
            {heading}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description || 'Quickly configure and manage your platform capabilities.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-accent-primary">
        <span>Explore Section</span>
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </Link>
  )
}

export default FeatureCard
