'use server'

import { EngagementEventType } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prismaClient'
import {
  enforcePublicLiveWebinarWriteRateLimit,
  RateLimitExceededError,
} from '@/lib/redis/rateLimit'

type ActionResult<T = undefined> =
  | { success: true; status: 200; data: T }
  | { success: false; status: 400 | 404 | 429 | 500; message: string }

// --- Guardrails -------------------------------------------------------
// These endpoints are reachable from public, unauthenticated attendee
// pages, so inputs are validated/clamped defensively rather than trusted.
const MAX_CHAT_TEXT_LENGTH = 500
const MAX_WATCH_SECONDS = 6 * 60 * 60 // 6 hours - generous ceiling, blocks garbage input

/**
 * Resolves the per-webinar Attendance row for a given attendee, since
 * EngagementEvent hangs off Attendance (not the global Attendee) - engagement
 * is inherently a per-webinar concept, same reasoning as callStatus.
 */
const resolveAttendanceId = async (
  attendeeId: string,
  webinarId: string
): Promise<string | null> => {
  const attendance = await prisma.attendance.findUnique({
    where: { attendeeId_webinarId: { attendeeId, webinarId } },
    select: { id: true },
  })
  return attendance?.id ?? null
}

/**
 * Logs a chat message the attendee sent during the webinar. Called from
 * the Stream Chat 'message.new' listener - fire-and-forget from the
 * client, so failures here must never surface as a UI error.
 */
export const logChatMessage = async (
  attendeeId: string,
  webinarId: string,
  text: string
): Promise<ActionResult> => {
  try {
    await enforcePublicLiveWebinarWriteRateLimit()

    const trimmed = text.trim().slice(0, MAX_CHAT_TEXT_LENGTH)
    if (!trimmed) {
      return { success: false, status: 400, message: 'Empty message' }
    }

    const attendanceId = await resolveAttendanceId(attendeeId, webinarId)
    if (!attendanceId) {
      return { success: false, status: 404, message: 'Attendance not found' }
    }

    await prisma.engagementEvent.create({
      data: {
        attendanceId,
        type: EngagementEventType.CHAT_MESSAGE,
        payload: { text: trimmed },
      },
    })

    return { success: true, status: 200, data: undefined }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, status: 429, message: error.message }
    }

    console.error('Error logging chat message engagement:', error)
    return { success: false, status: 500, message: 'Failed to log chat message' }
  }
}

/**
 * Logs the attendee clicking the webinar's CTA (e.g. "Book a Call"),
 * right before they're routed to the call page.
 */
export const logCtaClick = async (
  attendeeId: string,
  webinarId: string,
  ctaType: string
): Promise<ActionResult> => {
  try {
    await enforcePublicLiveWebinarWriteRateLimit()

    const attendanceId = await resolveAttendanceId(attendeeId, webinarId)
    if (!attendanceId) {
      return { success: false, status: 404, message: 'Attendance not found' }
    }

    await prisma.engagementEvent.create({
      data: {
        attendanceId,
        type: EngagementEventType.CTA_CLICK,
        payload: { ctaType },
      },
    })

    return { success: true, status: 200, data: undefined }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, status: 429, message: error.message }
    }

    console.error('Error logging CTA click engagement:', error)
    return { success: false, status: 500, message: 'Failed to log CTA click' }
  }
}

/**
 * Logs a watch-time heartbeat (cumulative seconds watched so far this
 * session). Called periodically (e.g. every 60s) while an attendee is on
 * the live webinar page.
 */
export const logWatchProgress = async (
  attendeeId: string,
  webinarId: string,
  secondsWatched: number
): Promise<ActionResult> => {
  try {
    await enforcePublicLiveWebinarWriteRateLimit()

    const clamped = Math.max(0, Math.min(Math.round(secondsWatched), MAX_WATCH_SECONDS))

    const attendanceId = await resolveAttendanceId(attendeeId, webinarId)
    if (!attendanceId) {
      return { success: false, status: 404, message: 'Attendance not found' }
    }

    await prisma.engagementEvent.create({
      data: {
        attendanceId,
        type: EngagementEventType.WATCH_PROGRESS,
        payload: { seconds: clamped },
      },
    })

    return { success: true, status: 200, data: undefined }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, status: 429, message: error.message }
    }

    console.error('Error logging watch progress engagement:', error)
    return { success: false, status: 500, message: 'Failed to log watch progress' }
  }
}

/**
 * Turns an attendee's raw engagement events for one webinar into a short,
 * plain-text note - meant to be injected into the AI agent's call context
 * (Phase 3), so the AI opens the conversation already knowing what this
 * person did during the webinar instead of starting cold.
 *
 * Deliberately templated rather than LLM-summarized for now: cheap, fast,
 * deterministic, and good enough signal for the agent to work with.
 */
export const buildEngagementSummary = async (
  attendeeId: string,
  webinarId: string
): Promise<ActionResult<string>> => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { attendeeId_webinarId: { attendeeId, webinarId } },
      select: {
        id: true,
        joinedAt: true,
        engagementEvents: {
          orderBy: { createdAt: 'asc' },
          select: { type: true, payload: true, createdAt: true },
        },
      },
    })

    if (!attendance) {
      return { success: false, status: 404, message: 'Attendance not found' }
    }

    const chatMessages = attendance.engagementEvents.filter(
      (e) => e.type === EngagementEventType.CHAT_MESSAGE
    )
    const ctaClicks = attendance.engagementEvents.filter(
      (e) => e.type === EngagementEventType.CTA_CLICK
    )
    const watchEvents = attendance.engagementEvents.filter(
      (e) => e.type === EngagementEventType.WATCH_PROGRESS
    )

    const maxWatchedSeconds = watchEvents.reduce((max, event) => {
      const seconds = (event.payload as { seconds?: number })?.seconds ?? 0
      return Math.max(max, seconds)
    }, 0)

    const lastChatMessage = chatMessages.at(-1)?.payload as
      | { text?: string }
      | undefined

    const lines: string[] = []

    if (maxWatchedSeconds > 0) {
      const minutes = Math.round(maxWatchedSeconds / 60)
      lines.push(
        minutes >= 1
          ? `Watched roughly ${minutes} minute${minutes === 1 ? '' : 's'} of the webinar.`
          : `Just joined the webinar briefly before booking a call.`
      )
    }

    if (chatMessages.length > 0) {
      lines.push(
        `Sent ${chatMessages.length} chat message${chatMessages.length === 1 ? '' : 's'} during the webinar.`
      )
      if (lastChatMessage?.text) {
        lines.push(`Their last chat message was: "${lastChatMessage.text}"`)
      }
    }

    if (ctaClicks.length > 1) {
      lines.push(
        `Clicked the call-to-action ${ctaClicks.length} times, suggesting strong interest.`
      )
    }

    const summary = lines.length > 0 ? lines.join(' ') : ''

    return { success: true, status: 200, data: summary }
  } catch (error) {
    console.error('Error building engagement summary:', error)
    return { success: false, status: 500, message: 'Failed to build engagement summary' }
  }
}