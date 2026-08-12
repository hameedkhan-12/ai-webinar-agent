import { redis } from '@/lib/redis'

const DASHBOARD_METRICS_TTL_SECONDS = 30

const dashboardMetricsKey = (userId: string) => `dashboard-metrics:${userId}`

export async function getCachedDashboardMetrics<T>(userId: string): Promise<T | null> {
  const cached = await redis.get(dashboardMetricsKey(userId))

  if (!cached) {
    return null
  }

  return JSON.parse(cached) as T
}

export async function setCachedDashboardMetrics(
  userId: string,
  data: unknown
): Promise<void> {
  await redis.set(
    dashboardMetricsKey(userId),
    JSON.stringify(data),
    'EX',
    DASHBOARD_METRICS_TTL_SECONDS
  )
}

export async function invalidateDashboardMetrics(userId: string): Promise<void> {
  await redis.del(dashboardMetricsKey(userId))
}
