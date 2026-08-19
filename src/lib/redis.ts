/**
 * Redis adapter that auto-selects the right client based on environment:
 *
 *   - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (Vercel / Upstash)
 *     → uses @upstash/redis (HTTP/REST, serverless-friendly, no TCP overhead)
 *
 *   - Otherwise (local Docker dev) → falls back to ioredis over TCP
 *
 * The exported `redis` object exposes the same method surface used throughout
 * the app (get, set, del, incr, expire, exists, smembers, sadd, srem, pipeline, multi).
 */

import type { Redis as IORedis } from 'ioredis'

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

export interface RedisAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>
  del(...keys: string[]): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  exists(...keys: string[]): Promise<number>
  smembers(key: string): Promise<string[]>
  sadd(key: string, ...members: string[]): Promise<number>
  srem(key: string, ...members: string[]): Promise<number>
  ping(): Promise<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pipeline(): PipelineAdapter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multi(): PipelineAdapter
  on(event: string, listener: (...args: unknown[]) => void): this
}

export interface PipelineAdapter {
  get(key: string): this
  set(key: string, value: string, ...args: unknown[]): this
  del(...keys: string[]): this
  incr(key: string): this
  expire(key: string, seconds: number): this
  exists(...keys: string[]): this
  smembers(key: string): this
  sadd(key: string, ...members: string[]): this
  srem(key: string, ...members: string[]): this
  exec(): Promise<[Error | null, unknown][]>
}

// ──────────────────────────────────────────────────────
// Upstash HTTP adapter
// ──────────────────────────────────────────────────────

function createUpstashAdapter(): RedisAdapter {
  // Dynamically import to avoid bundling when not needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')

  const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  // Minimal pipeline shim for Upstash (executes commands sequentially in a batch)
  class UpstashPipeline implements PipelineAdapter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private commands: Array<() => Promise<any>> = []

    get(key: string) { this.commands.push(() => client.get(key)); return this }
    set(key: string, value: string, ...args: unknown[]) {
      // Handle SET with EX option
      const exIdx = (args as string[]).indexOf('EX')
      if (exIdx !== -1) {
        const ttl = args[exIdx + 1] as number
        this.commands.push(() => client.setex(key, ttl, value))
      } else {
        this.commands.push(() => client.set(key, value))
      }
      return this
    }
    del(...keys: string[]) { this.commands.push(() => client.del(...keys as [string, ...string[]])); return this }
    incr(key: string) { this.commands.push(() => client.incr(key)); return this }
    expire(key: string, seconds: number) { this.commands.push(() => client.expire(key, seconds)); return this }
    exists(...keys: string[]) { this.commands.push(() => client.exists(...keys as [string, ...string[]])); return this }
    smembers(key: string) { this.commands.push(() => client.smembers(key)); return this }
    sadd(key: string, ...members: string[]) { this.commands.push(() => client.sadd(key, ...members as [string, ...string[]])); return this }
    srem(key: string, ...members: string[]) { this.commands.push(() => client.srem(key, ...members as [string, ...string[]])); return this }

    async exec(): Promise<[Error | null, unknown][]> {
      const results = await Promise.allSettled(this.commands.map(fn => fn()))
      return results.map(r =>
        r.status === 'fulfilled'
          ? [null, r.value]
          : [r.reason instanceof Error ? r.reason : new Error(String(r.reason)), null]
      )
    }
  }

  const adapter: RedisAdapter = {
    async get(key) { return client.get<string>(key) },
    async set(key, value, ...args) {
      const exIdx = (args as string[]).indexOf('EX')
      if (exIdx !== -1) {
        return client.setex(key, args[exIdx + 1] as number, value)
      }
      return client.set(key, value)
    },
    async del(...keys) { return client.del(...keys as [string, ...string[]]) },
    async incr(key) { return client.incr(key) },
    async expire(key, seconds) { return client.expire(key, seconds) },
    async exists(...keys) { return client.exists(...keys as [string, ...string[]]) },
    async smembers(key) { return client.smembers(key) },
    async sadd(key, ...members) { return client.sadd(key, ...members as [string, ...string[]]) },
    async srem(key, ...members) { return client.srem(key, ...members as [string, ...string[]]) },
    async ping() { await client.ping(); return 'PONG' },
    pipeline() { return new UpstashPipeline() },
    multi() { return new UpstashPipeline() },
    on(_event, _listener) { return adapter },
  }

  return adapter
}

// ──────────────────────────────────────────────────────
// ioredis adapter (local dev / non-Upstash)
// ──────────────────────────────────────────────────────

const globalForIoRedis = globalThis as unknown as { ioRedisClient: IORedis | undefined }

function createIoRedisAdapter(): RedisAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Redis = require('ioredis') as typeof import('ioredis')

  if (!globalForIoRedis.ioRedisClient) {
    const url = process.env.REDIS_URL?.trim()
    if (!url) throw new Error('REDIS_URL not configured')

    const client = new (Redis as unknown as new (url: string, options: object) => IORedis)(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      enableOfflineQueue: false,
      commandTimeout: 2000,
      retryStrategy(times: number) {
        if (times >= 3) return null
        return Math.min(times * 100, 3000)
      },
    })
    client.on('error', (err: Error) => console.warn('[Redis/ioredis Error]', err.message))
    globalForIoRedis.ioRedisClient = client
  }

  const client = globalForIoRedis.ioRedisClient!

  // Wrap ioredis pipeline to match PipelineAdapter interface
  function wrapPipeline(p: ReturnType<IORedis['pipeline']>): PipelineAdapter {
    const wrapper: PipelineAdapter = {
      get(key) { p.get(key); return wrapper },
      set(key, value, ...args) {
        const exIdx = (args as string[]).indexOf('EX')
        if (exIdx !== -1) {
          p.setex(key, args[exIdx + 1] as number, value)
        } else {
          p.set(key, value)
        }
        return wrapper
      },
      del(...keys) { p.del(...keys as [string, ...string[]]); return wrapper },
      incr(key) { p.incr(key); return wrapper },
      expire(key, seconds) { p.expire(key, seconds); return wrapper },
      exists(...keys) { p.exists(...keys as [string, ...string[]]); return wrapper },
      smembers(key) { p.smembers(key); return wrapper },
      sadd(key, ...members) { p.sadd(key, ...members as [string, ...string[]]); return wrapper },
      srem(key, ...members) { p.srem(key, ...members as [string, ...string[]]); return wrapper },
      async exec() {
        const results = await p.exec()
        return (results || []) as [Error | null, unknown][]
      },
    }
    return wrapper
  }

  const adapter: RedisAdapter = {
    async get(key) { return client.get(key) },
    async set(key, value, ...args) {
      const exIdx = (args as string[]).indexOf('EX')
      if (exIdx !== -1) {
        return client.setex(key, args[exIdx + 1] as number, value)
      }
      return client.set(key, value)
    },
    async del(...keys) { return client.del(...keys as [string, ...string[]]) },
    async incr(key) { return client.incr(key) },
    async expire(key, seconds) { return client.expire(key, seconds) },
    async exists(...keys) { return client.exists(...keys as [string, ...string[]]) },
    async smembers(key) { return client.smembers(key) },
    async sadd(key, ...members) { return client.sadd(key, ...members as [string, ...string[]]) },
    async srem(key, ...members) { return client.srem(key, ...members as [string, ...string[]]) },
    async ping() { return client.ping() },
    pipeline() { return wrapPipeline(client.pipeline()) },
    multi() { return wrapPipeline(client.multi()) },
    on(event, listener) { client.on(event, listener as () => void); return adapter },
  }

  return adapter
}

// ──────────────────────────────────────────────────────
// Auto-select adapter
// ──────────────────────────────────────────────────────

function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  )
}

const globalForAdapter = globalThis as unknown as { redisAdapter: RedisAdapter | undefined }

function getAdapter(): RedisAdapter {
  if (!globalForAdapter.redisAdapter) {
    globalForAdapter.redisAdapter = isUpstashConfigured()
      ? createUpstashAdapter()
      : createIoRedisAdapter()
  }
  return globalForAdapter.redisAdapter
}

export const redis = new Proxy({} as RedisAdapter, {
  get(_target, prop) {
    const adapter = getAdapter()
    const value = adapter[prop as keyof RedisAdapter]
    return typeof value === 'function' ? (value as Function).bind(adapter) : value
  },
})

export function isRedisConfigured(): boolean {
  return isUpstashConfigured() || !!(process.env.REDIS_URL?.trim())
}

export async function checkRedisConnection(): Promise<void> {
  if (!isRedisConfigured()) {
    throw new Error('Redis is not configured (set UPSTASH_REDIS_REST_URL/TOKEN or REDIS_URL)')
  }
  const pong = await redis.ping()
  if (pong !== 'PONG') {
    throw new Error(`Unexpected Redis PING response: ${pong}`)
  }
}

/**
 * For BullMQ — only works with ioredis. Returns a raw ioredis instance.
 * On Upstash environments BullMQ is not supported.
 */
export function createBullMQConnection(): IORedis {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Redis = require('ioredis') as typeof import('ioredis')
  const url = process.env.REDIS_URL?.trim()
  if (!url) throw new Error('REDIS_URL is required for BullMQ (not available on Upstash HTTP)')
  return new (Redis as unknown as new (url: string, options: object) => IORedis)(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    enableOfflineQueue: false,
  })
}
