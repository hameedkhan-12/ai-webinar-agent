import type { CtaTypeEnum, WebinarStatusEnum } from '@/generated/prisma/enums'

/** Serializable webinar shape safe for client components (no Prisma client). */
export type WebinarListItem = {
  id: string
  title: string
  description: string | null
  startTime: string
  webinarStatus: WebinarStatusEnum
  tags: string[]
  ctaType: CtaTypeEnum
  thumbnail: string | null
}

export function toWebinarListItem(webinar: {
  id: string
  title: string
  description: string | null
  startTime: Date
  webinarStatus: WebinarStatusEnum
  tags: string[]
  ctaType: CtaTypeEnum
  thumbnail: string | null
}): WebinarListItem {
  return {
    id: webinar.id,
    title: webinar.title,
    description: webinar.description,
    startTime: webinar.startTime.toISOString(),
    webinarStatus: webinar.webinarStatus,
    tags: webinar.tags,
    ctaType: webinar.ctaType,
    thumbnail: webinar.thumbnail,
  }
}
