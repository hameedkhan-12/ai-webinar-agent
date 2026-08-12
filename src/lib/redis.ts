import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    throw new Error(
      'REDIS_URL environment variable is required. Redis is a mandatory dependency.'
    )
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  })
}

export const redis = globalForRedis.redis ?? (globalForRedis.redis = createRedisClient())

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

/**
 * BullMQ requires a dedicated connection with maxRetriesPerRequest: null.
 * Use this factory for queue/worker setup — do not pass the general `redis` instance.
 */
export function createBullMQConnection(): Redis {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    throw new Error(
      'REDIS_URL environment variable is required. Redis is a mandatory dependency.'
    )
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  })
}

export async function checkRedisConnection(): Promise<void> {
  const pong = await redis.ping()

  if (pong !== 'PONG') {
    throw new Error(`Unexpected Redis PING response: ${pong}`)
  }
}
