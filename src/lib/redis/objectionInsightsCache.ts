import { redis } from '@/lib/redis'

const OBJECTION_INSIGHTS_TTL_SECONDS = 300

export const objectionInsightsKey = (webinarId: string) =>
  `objection-insights:${webinarId}`

export const presenterObjectionInsightsKey = (userId: string) =>
  `objection-insights:presenter:${userId}`

export async function getCachedObjectionInsights<T>(
  cacheKey: string
): Promise<T | null> {
  const cached = await redis.get(cacheKey)

  if (!cached) {
    return null
  }

  return JSON.parse(cached) as T
}

export async function setCachedObjectionInsights(
  cacheKey: string,
  data: unknown
): Promise<void> {
  await redis.set(
    cacheKey,
    JSON.stringify(data),
    'EX',
    OBJECTION_INSIGHTS_TTL_SECONDS
  )
}

export async function invalidateObjectionInsights(
  webinarId: string,
  presenterId?: string
): Promise<void> {
  await redis.del(objectionInsightsKey(webinarId))

  if (presenterId) {
    await redis.del(presenterObjectionInsightsKey(presenterId))
  }
}
