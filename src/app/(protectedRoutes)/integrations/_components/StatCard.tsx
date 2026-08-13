'use client'

import { LucideIcon } from 'lucide-react'

type StatCardProps = {
  label: string
  value: number
  icon: LucideIcon
  iconClassName?: string
  iconBgClassName?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName = 'text-accent-primary',
  iconBgClassName = 'bg-accent-primary/10 border-accent-primary/20',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 transition-shadow duration-200 hover:shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconBgClassName}`}
        >
          <Icon className={`h-5 w-5 ${iconClassName}`} strokeWidth={1.75} />
        </div>

        <div className="min-w-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {value}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  )
}
