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
  try {
    await redis
      .multi()
      .set(activeCallKey(attendanceId), webinarId, 'EX', ACTIVE_CALL_TTL_SECONDS)
      .sadd(webinarActiveCallsKey(webinarId), attendanceId)
      .sadd(GLOBAL_ACTIVE_CALLS_KEY, attendanceId)
      .exec()
  } catch (error) {
    console.warn('[presence] markCallActive failed:', error)
  }
}

export async function markCallEnded(
  attendanceId: string,
  webinarId: string
): Promise<void> {
  try {
    await redis
      .multi()
      .del(activeCallKey(attendanceId))
      .srem(webinarActiveCallsKey(webinarId), attendanceId)
      .srem(GLOBAL_ACTIVE_CALLS_KEY, attendanceId)
      .exec()
  } catch (error) {
    console.warn('[presence] markCallEnded failed:', error)
  }
}

async function countActiveMembers(setKey: string): Promise<number> {
  try {
    const members = await redis.smembers(setKey)

    if (members.length === 0) {
      return 0
    }

    // Batch all EXISTS checks in a single pipeline round-trip instead of N serial calls
    const pipeline = redis.pipeline()
    for (const attendanceId of members) {
      pipeline.exists(activeCallKey(attendanceId))
    }
    const results = await pipeline.exec()

    let activeCount = 0
    const staleMembers: string[] = []

    if (results) {
      results.forEach(([err, exists], i) => {
        if (!err && exists) {
          activeCount++
        } else {
          staleMembers.push(members[i])
        }
      })
    }

    if (staleMembers.length > 0) {
      // Fire-and-forget cleanup
      redis.srem(setKey, ...staleMembers).catch(() => {})
    }

    return activeCount
  } catch (error) {
    console.warn('[presence] countActiveMembers failed:', error)
    return 0
  }
}

export async function getActiveCallCount(webinarId?: string): Promise<number> {
  try {
    const setKey = webinarId ? webinarActiveCallsKey(webinarId) : GLOBAL_ACTIVE_CALLS_KEY
    return await countActiveMembers(setKey)
  } catch (error) {
    console.warn('[presence] getActiveCallCount failed:', error)
    return 0
  }
}

export async function getActiveCallCountForUser(userId: string): Promise<number> {
  try {
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
  } catch (error) {
    console.warn('[presence] getActiveCallCountForUser failed:', error)
    return 0
  }
}

