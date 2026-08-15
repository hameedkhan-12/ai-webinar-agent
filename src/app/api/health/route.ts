import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prismaClient'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    checks.redis = 'error'
  } else {
    try {
      const { checkRedisConnection, isRedisConfigured } = await import('@/lib/redis')

      if (!isRedisConfigured()) {
        checks.redis = 'error'
      } else {
        await checkRedisConnection()
        checks.redis = 'ok'
      }
    } catch {
      checks.redis = 'error'
    }
  }

  const healthy = Object.values(checks).every((status) => status === 'ok')

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  )
}
