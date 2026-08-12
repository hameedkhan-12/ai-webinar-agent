import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// In development, hot-reloading preserves globalThis.prisma.
// Check if newly generated models (e.g. 'objection') exist on the cached client;
// if not, recreate the client to pick up the updated schema.
export const prisma =
  globalForPrisma.prisma && 'objection' in (globalForPrisma.prisma as unknown as Record<string, unknown>)
    ? globalForPrisma.prisma
    : (globalForPrisma.prisma = new PrismaClient({ adapter }))

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
