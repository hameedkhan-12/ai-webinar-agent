'use client'

import PipelineIcon from '@/icons/PipelineIcon'
import { WebinarStatusEnum, CtaTypeEnum } from '@/generated/prisma/enums'
import type { WebinarListItem } from '@/lib/webinar-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import {
  Brain,
  Calendar,
  Clock,
  ExternalLink,
  PhoneCall,
  ShoppingCart,
  Tag,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  webinar: WebinarListItem
}

function getStatusBadge(status: WebinarListItem['webinarStatus']) {
  switch (status) {
    case WebinarStatusEnum.LIVE:
      return (
        <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-600">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </Badge>
      )
    case WebinarStatusEnum.ENDED:
      return (
        <Badge variant="secondary" className="border border-border bg-secondary text-muted-foreground">
          Ended
        </Badge>
      )
    case WebinarStatusEnum.CANCELLED:
      return (
        <Badge variant="outline" className="border-destructive/30 text-destructive">
          Cancelled
        </Badge>
      )
    case WebinarStatusEnum.WAITING_ROOM:
      return (
        <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-700">
          Waiting Room
        </Badge>
      )
    default:
      return (
        <Badge className="border border-purple-500 bg-purple-500/15 text-purple-500">
          Upcoming
        </Badge>
      )
  }
}

const WebinarCard = ({ webinar }: Props) => {
  const startTime = new Date(webinar.startTime)
  const formattedDate = format(startTime, 'MMM d, yyyy')
  const formattedTime = format(startTime, 'h:mm a')
  const isBookCall = webinar.ctaType === CtaTypeEnum.BOOK_A_CALL

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:border-border hover:shadow-md">
      <Link href={`/live-webinar/${webinar.id}`} className="relative block">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-accent-primary/15 via-background to-accent-secondary/10">
          <Image
            src={webinar.thumbnail || '/darkthumbnail.png'}
            alt={webinar.title}
            fill
            className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute left-3 top-3">{getStatusBadge(webinar.webinarStatus)}</div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <Link href={`/live-webinar/${webinar.id}`} className="block">
            <h3 className="line-clamp-1 text-base font-semibold text-foreground transition-colors group-hover:text-accent-primary">
              {webinar.title}
            </h3>
          </Link>
          {webinar.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{webinar.description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formattedTime}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-secondary-foreground">
            {isBookCall ? (
              <>
                <PhoneCall className="h-3 w-3" />
                Book a Call
              </>
            ) : (
              <>
                <ShoppingCart className="h-3 w-3" />
                Buy Now
              </>
            )}
          </span>
        </div>

        {webinar.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {webinar.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-border/70 px-2 py-0 text-[10px] font-normal text-muted-foreground"
              >
                <Tag className="mr-1 h-2.5 w-2.5" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-2 border-t border-border/70 pt-4">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/live-webinar/${webinar.id}`}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="shrink-0" title="Objection Insights">
            <Link href={`/webinars/${webinar.id}/insights`}>
              <Brain className="h-4 w-4 text-accent-primary" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="shrink-0" title="Lead Pipeline">
            <Link href={`/webinars/${webinar.id}/pipeline`}>
              <PipelineIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

export default WebinarCard
