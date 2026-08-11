'use client'

import React from 'react'
import { Info, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type KpiCardProps = {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: string
    isUp?: boolean
    caption?: string
  }
}

export function KpiCard({ title, value, icon, trend }: KpiCardProps) {
  return (
    <div className="p-5 rounded-2xl border border-border/60 bg-card hover:border-border/90 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header: Outline Icon Badge + Title + Info Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-border/80 bg-background/50 flex items-center justify-center text-foreground/80 shrink-0">
            {icon}
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        </div>
        <button className="text-muted-foreground/60 hover:text-foreground transition-colors">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Value + Trend Badge */}
      <div className="flex items-baseline justify-between gap-2 pt-1">
        <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">
          {value}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                trend.isUp !== false
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}
            >
              {trend.isUp !== false ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trend.value}
            </span>
            {trend.caption && (
              <span className="text-[11px] text-muted-foreground hidden xl:inline">
                {trend.caption}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
