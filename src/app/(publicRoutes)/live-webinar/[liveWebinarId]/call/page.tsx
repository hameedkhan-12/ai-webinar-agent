import { getAttendeeById } from '@/actions/attendance'
import { getWebinarById } from '@/actions/webinar'
import { buildEngagementSummary } from '@/actions/engagement'
import { WebinarWithPresenter } from '@/lib/type'
import { CallStatusEnum, WebinarStatusEnum } from '@/generated/prisma/enums'
import { redirect } from 'next/navigation'
import AutoConnectCall from './AutoConnectCall'

type Props = {
  params: Promise<{
    liveWebinarId: string
  }>
  searchParams: Promise<{
    attendeeId: string
  }>
}

const page = async ({ params, searchParams }: Props) => {
  const { liveWebinarId } = await params
  const { attendeeId } = await searchParams

  if (!liveWebinarId || !attendeeId) {
    redirect('/404')
  }
  const attendee = await getAttendeeById(attendeeId, liveWebinarId)

  if (!attendee.data) {
    redirect(`/live-webinar/${liveWebinarId}?error=attendee-not-found`)
  }

  const webinar = await getWebinarById(liveWebinarId)
  if (!webinar) {
    redirect('/404')
  }

  if (
    webinar.webinarStatus === WebinarStatusEnum.WAITING_ROOM ||
    webinar.webinarStatus === WebinarStatusEnum.SCHEDULED
  ) {
    redirect(`/live-webinar/${liveWebinarId}?error=webinar-not-started`)
  }
  
  if (webinar.ctaType !== 'BOOK_A_CALL' || !webinar.aiAgentId) {
    redirect(`/live-webinar/${liveWebinarId}?error=cannot-book-a-call`)
  }

  if (attendee.data.callStatus === CallStatusEnum.COMPLETED) {
    redirect(`/live-webinar/${liveWebinarId}?error=call-not-pending`)
  }

  // Engagement context is a nice-to-have for a warmer call opener, never
  // a hard requirement - if it fails, the call still starts normally.
  const engagementSummaryResult = await buildEngagementSummary(
    attendeeId,
    liveWebinarId
  )
  const engagementSummary = engagementSummaryResult.success
    ? engagementSummaryResult.data
    : undefined

  return (
    <AutoConnectCall
      userName={attendee.data.name}
      assistantId={webinar.aiAgentId}
      webinar={webinar as WebinarWithPresenter}
      userId={attendeeId}
      engagementSummary={engagementSummary}
    />
  )
}

export default page