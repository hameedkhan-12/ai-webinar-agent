import { redis } from '@/lib/redis'

const OBJECTION_INSIGHTS_TTL_SECONDS = 300

export const objectionInsightsKey = (webinarId: string) =>
  `objection-insights:${webinarId}`

export const presenterObjectionInsightsKey = (userId: string) =>
  `objection-insights:presenter:${userId}`

export async function getCachedObjectionInsights<T>(
  cacheKey: string
): Promise<T | null> {
  try {
    const cached = await redis.get(cacheKey)
    if (!cached) return null
    return JSON.parse(cached) as T
  } catch (error) {
    console.warn('[objectionInsightsCache] Redis get failed:', error)
    return null
  }
}

export async function setCachedObjectionInsights(
  cacheKey: string,
  data: unknown
): Promise<void> {
  try {
    await redis.set(
      cacheKey,
      JSON.stringify(data),
      'EX',
      OBJECTION_INSIGHTS_TTL_SECONDS
    )
  } catch (error) {
    console.warn('[objectionInsightsCache] Redis set failed:', error)
  }
}

export async function invalidateObjectionInsights(
  webinarId: string,
  presenterId?: string
): Promise<void> {
  try {
    await redis.del(objectionInsightsKey(webinarId))

    if (presenterId) {
      await redis.del(presenterObjectionInsightsKey(presenterId))
    }
  } catch (error) {
    console.warn('[objectionInsightsCache] Redis invalidation failed:', error)
  }
}
