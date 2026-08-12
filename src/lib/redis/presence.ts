import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prismaClient'

const ACTIVE_CALL_TTL_SECONDS = 300

const activeCallKey = (attendanceId: string) => `active-call:${attendanceId}`
const webinarActiveCallsKey = (webinarId: string) => `active-calls:${webinarId}`
const GLOBAL_ACTIVE_CALLS_KEY = 'active-calls:global'

export async function markCallActive(
  attendanceId: string,
  webinarId: string
): Promise<void> {
  await redis
    .multi()
    .set(activeCallKey(attendanceId), webinarId, 'EX', ACTIVE_CALL_TTL_SECONDS)
    .sadd(webinarActiveCallsKey(webinarId), attendanceId)
    .sadd(GLOBAL_ACTIVE_CALLS_KEY, attendanceId)
    .exec()
}

export async function markCallEnded(
  attendanceId: string,
  webinarId: string
): Promise<void> {
  await redis
    .multi()
    .del(activeCallKey(attendanceId))
    .srem(webinarActiveCallsKey(webinarId), attendanceId)
    .srem(GLOBAL_ACTIVE_CALLS_KEY, attendanceId)
    .exec()
}

async function countActiveMembers(setKey: string): Promise<number> {
  const members = await redis.smembers(setKey)

  if (members.length === 0) {
    return 0
  }

  let activeCount = 0
  const staleMembers: string[] = []

  for (const attendanceId of members) {
    const exists = await redis.exists(activeCallKey(attendanceId))

    if (exists) {
      activeCount++
    } else {
      staleMembers.push(attendanceId)
    }
  }

  if (staleMembers.length > 0) {
    await redis.srem(setKey, ...staleMembers)
  }

  return activeCount
}

export async function getActiveCallCount(webinarId?: string): Promise<number> {
  const setKey = webinarId ? webinarActiveCallsKey(webinarId) : GLOBAL_ACTIVE_CALLS_KEY
  return countActiveMembers(setKey)
}

export async function getActiveCallCountForUser(userId: string): Promise<number> {
  const webinars = await prisma.webinar.findMany({
    where: { presenterId: userId },
    select: { id: true },
  })

  if (webinars.length === 0) {
    return 0
  }

  const counts = await Promise.all(
    webinars.map((webinar) => getActiveCallCount(webinar.id))
  )

  return counts.reduce((total, count) => total + count, 0)
}
