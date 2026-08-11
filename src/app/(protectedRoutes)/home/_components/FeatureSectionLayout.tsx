'use client'

import RightIcon from '@/icons/RightIcon'
import Link from 'next/link'
import React from 'react'

type Props = {
  children: React.ReactNode
  heading: string
  link: string
  className?: string
}

const FeatureSectionLayout = ({
  children,
  heading,
  link,
  className = '',
}: Props) => {
  return (
    <div
      className={`p-6 rounded-2xl border border-border/60 bg-card shadow-xs flex flex-col justify-between space-y-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-foreground tracking-tight">
          {heading}
        </h3>
        <Link
          href={link}
          className="text-xs font-semibold text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 transition-colors"
        >
          View details <RightIcon className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      <div className="w-full">{children}</div>
    </div>
  )
}

export default FeatureSectionLayout
