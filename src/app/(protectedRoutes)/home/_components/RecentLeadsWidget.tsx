'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MoreHorizontal, Users, ArrowUpRight } from 'lucide-react'

type AttendanceItem = {
  id: string
  attendeeId: string
  name: string
  email: string
  createdAt: Date
  webinarTitle: string
  tags: string[]
}

type Props = {
  recentAttendances: AttendanceItem[]
}

export function RecentLeadsWidget({ recentAttendances }: Props) {
  return (
    <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs flex flex-col justify-between space-y-5 h-full">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-foreground tracking-tight">
            Recent Registrations
          </h3>
          <p className="text-xs text-muted-foreground">Latest webinar leads</p>
        </div>
        <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 space-y-3">
        {recentAttendances.length > 0 ? (
          recentAttendances.slice(0, 4).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {item.name ? item.name.slice(0, 1).toUpperCase() : 'L'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent-primary transition-colors">
                    {item.name || 'Lead Attendee'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.email}</p>
                </div>
              </div>

              <div className="shrink-0 pl-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-card border border-border/60 text-muted-foreground">
                  {item.tags?.[0] || item.webinarTitle?.slice(0, 14) || 'Webinar'}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-10 text-center space-y-2 rounded-xl border border-dashed border-border/60 bg-secondary/20">
            <Users className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-xs font-medium text-foreground">No recent registrations</p>
            <p className="text-[11px] text-muted-foreground">Leads will appear here as they register</p>
          </div>
        )}
      </div>

      {/* Widget Footer Link */}
      <div className="pt-2 border-t border-border/40">
        <Link
          href="/lead"
          className="flex items-center justify-between text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          <span>View All Lead Registrations</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
