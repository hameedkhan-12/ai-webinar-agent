import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL?.trim()
}

function isValidRedisUrl(url: string | undefined): url is string {
  if (!url) {
    return false
  }

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'redis:' || parsed.protocol === 'rediss:'
  } catch {
    return false
  }
}

function createRedisClient(options: { maxRetriesPerRequest: number | null }): Redis {
  const redisUrl = getRedisUrl()

  if (!isValidRedisUrl(redisUrl)) {
    throw new Error('REDIS_URL is invalid or not configured')
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: options.maxRetriesPerRequest,
    enableReadyCheck: false,
    lazyConnect: true,
    enableOfflineQueue: true,
    retryStrategy(times) {
      return Math.min(times * 100, 3000)
    },
  })
}

function getRedisClient(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = createRedisClient({ maxRetriesPerRequest: null })
  }

  return globalForRedis.redis
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedisClient()
    const value = client[prop as keyof Redis]

    return typeof value === 'function' ? value.bind(client) : value
  },
})

/**
 * BullMQ requires a dedicated connection with maxRetriesPerRequest: null.
 * Use this factory for queue/worker setup — do not pass the general `redis` instance.
 */
export function createBullMQConnection(): Redis {
  return createRedisClient({ maxRetriesPerRequest: null })
}

export function isRedisConfigured(): boolean {
  return isValidRedisUrl(getRedisUrl())
}

export async function checkRedisConnection(): Promise<void> {
  if (!isRedisConfigured()) {
    throw new Error('REDIS_URL is invalid or not configured')
  }

  const pong = await redis.ping()

  if (pong !== 'PONG') {
    throw new Error(`Unexpected Redis PING response: ${pong}`)
  }
}
