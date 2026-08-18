import { redis } from '@/lib/redis'

const DASHBOARD_METRICS_TTL_SECONDS = 30

const dashboardMetricsKey = (userId: string) => `dashboard-metrics:${userId}`

export async function getCachedDashboardMetrics<T>(userId: string): Promise<T | null> {
  try {
    const cached = await redis.get(dashboardMetricsKey(userId))
    if (!cached) return null
    return JSON.parse(cached) as T
  } catch (error) {
    console.warn('[dashboardMetricsCache] Redis get failed:', error)
    return null
  }
}

export async function setCachedDashboardMetrics(
  userId: string,
  data: unknown
): Promise<void> {
  try {
    await redis.set(
      dashboardMetricsKey(userId),
      JSON.stringify(data),
      'EX',
      DASHBOARD_METRICS_TTL_SECONDS
    )
  } catch (error) {
    console.warn('[dashboardMetricsCache] Redis set failed:', error)
  }
}

export async function invalidateDashboardMetrics(userId: string): Promise<void> {
  try {
    await redis.del(dashboardMetricsKey(userId))
  } catch (error) {
    console.warn('[dashboardMetricsCache] Redis invalidation failed:', error)
  }
}
