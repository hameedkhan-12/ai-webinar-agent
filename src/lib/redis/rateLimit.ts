import { headers } from 'next/headers'
import { redis } from '@/lib/redis'

export class RateLimitExceededError extends Error {
  readonly status = 429

  constructor(message = 'Too many requests') {
    super(message)
    this.name = 'RateLimitExceededError'
  }
}

export async function enforceRateLimit(options: {
  key: string
  limit: number
  windowSeconds: number
}): Promise<void> {
  try {
    const { key, limit, windowSeconds } = options
    const redisKey = `rate-limit:${key}`

    const count = await redis.incr(redisKey)

    if (count === 1) {
      await redis.expire(redisKey, windowSeconds)
    }

    if (count > limit) {
      throw new RateLimitExceededError(
        `Rate limit exceeded. Maximum ${limit} requests per ${windowSeconds} seconds.`
      )
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      throw error
    }
    console.warn('[rateLimit] Redis rate limit check failed, allowing request:', error)
  }
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers()

  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  )
}

export async function enforcePublicLiveWebinarWriteRateLimit(): Promise<void> {
  const limit = Number(process.env.PUBLIC_LIVE_WEBINAR_RATE_LIMIT_PER_MINUTE ?? 20)
  const ip = await getClientIp()

  await enforceRateLimit({
    key: `public-live-webinar:${ip}`,
    limit,
    windowSeconds: 60,
  })
}

export async function enforceObjectionClassificationRateLimit(
  webinarId: string
): Promise<void> {
  const limit = Number(process.env.OBJECTION_CLASSIFICATION_RATE_LIMIT_PER_HOUR ?? 100)

  await enforceRateLimit({
    key: `classify:${webinarId}`,
    limit,
    windowSeconds: 3600,
  })
}
