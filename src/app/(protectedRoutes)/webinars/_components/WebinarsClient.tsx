'use client'

import { WebinarStatusEnum } from '@/generated/prisma/enums'
import type { WebinarListItem } from '@/lib/webinar-list'
import { StatCard } from '@/app/(protectedRoutes)/integrations/_components/StatCard'
import WebinarCard from './WebinarCard'
import { Input } from '@/components/ui/input'
import {
  CalendarClock,
  CircleCheck,
  Radio,
  Search,
  Video,
  VideoOff,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type Filter = 'all' | 'upcoming' | 'ended' | 'live'

type Props = {
  webinars: WebinarListItem[]
  initialFilter?: string
}

function matchesFilter(webinar: WebinarListItem, filter: Filter): boolean {
  switch (filter) {
    case 'upcoming':
      return (
        webinar.webinarStatus === WebinarStatusEnum.SCHEDULED ||
        webinar.webinarStatus === WebinarStatusEnum.WAITING_ROOM
      )
    case 'live':
      return webinar.webinarStatus === WebinarStatusEnum.LIVE
    case 'ended':
      return (
        webinar.webinarStatus === WebinarStatusEnum.ENDED ||
        webinar.webinarStatus === WebinarStatusEnum.CANCELLED
      )
    default:
      return true
  }
}

const filterLabels: Record<Filter, string> = {
  all: 'All Webinars',
  upcoming: 'Upcoming',
  live: 'Live',
  ended: 'Ended',
}

export function WebinarsClient({ webinars, initialFilter }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>(() => {
    if (initialFilter === 'upcoming' || initialFilter === 'ended' || initialFilter === 'live') {
      return initialFilter
    }
    return 'all'
  })

  const stats = useMemo(
    () => ({
      total: webinars.length,
      upcoming: webinars.filter((w) => matchesFilter(w, 'upcoming')).length,
      live: webinars.filter((w) => matchesFilter(w, 'live')).length,
      ended: webinars.filter((w) => matchesFilter(w, 'ended')).length,
    }),
    [webinars]
  )

  const filteredWebinars = useMemo(() => {
    return webinars
      .filter((webinar) => matchesFilter(webinar, filter))
      .filter((webinar) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          webinar.title.toLowerCase().includes(q) ||
          (webinar.description?.toLowerCase().includes(q) ?? false) ||
          webinar.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }, [webinars, filter, search])

  const filters: Filter[] = ['all', 'upcoming', 'live', 'ended']

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Webinars</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage schedules, preview live rooms, and open pipeline tools for each event.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Webinars"
          value={stats.total}
          icon={Video}
          iconClassName="text-accent-primary"
          iconBgClassName="bg-accent-primary/10 border-accent-primary/20"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={CalendarClock}
          iconClassName="text-blue-500"
          iconBgClassName="bg-blue-500/10 border-blue-500/20"
        />
        <StatCard
          label="Live Now"
          value={stats.live}
          icon={Radio}
          iconClassName="text-emerald-500"
          iconBgClassName="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatCard
          label="Ended"
          value={stats.ended}
          icon={CircleCheck}
          iconClassName="text-violet-500"
          iconBgClassName="bg-violet-500/10 border-violet-500/20"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search webinars by title, description, or tag..."
            className="border-border bg-background pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                filter === item
                  ? 'border-accent-primary bg-accent-primary text-white shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
              }`}
            >
              {filterLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {filteredWebinars.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredWebinars.map((webinar) => (
            <WebinarCard key={webinar.id} webinar={webinar} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
            <VideoOff className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No webinars found</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {search.trim()
              ? 'Try a different search term or clear your filters.'
              : filter === 'all'
                ? 'Create your first webinar using the Create Webinar button in the header.'
                : `No ${filterLabels[filter].toLowerCase()} webinars yet.`}
          </p>
        </div>
      )}
    </div>
  )
}
