'use server'

import { prisma } from '@/lib/prismaClient'
import { getAdapter } from '@/lib/integrations/adapters'
import { getIntegration, INTEGRATIONS } from '@/lib/integrations/registry'
import type { LeadSyncPayload } from '@/lib/integrations/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SaveIntegrationInput = {
  integrationId: string
  config: Record<string, string>
  enabled?: boolean
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns all UserIntegration rows for this user, merged with registry metadata.
 */
export async function getUserIntegrations(userId: string) {
  try {
    const rows = await prisma.userIntegration.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return { data: rows, error: null }
  } catch (e) {
    console.error('[integrations] getUserIntegrations error:', e)
    return { data: [], error: 'Failed to load integrations' }
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Upsert an integration's config for a user.
 * Config values are stored as-is (JSON). For production you would encrypt
 * secrets at rest before storing.
 */
export async function saveIntegration(userId: string, input: SaveIntegrationInput) {
  try {
    const meta = getIntegration(input.integrationId)
    if (!meta) return { data: null, error: `Unknown integration: ${input.integrationId}` }

    // Validate required fields
    const missing = meta.configFields
      .filter((f) => f.required && !input.config[f.key]?.trim())
      .map((f) => f.label)

    if (missing.length > 0) {
      return { data: null, error: `Missing required fields: ${missing.join(', ')}` }
    }

    const row = await prisma.userIntegration.upsert({
      where: { userId_integrationId: { userId, integrationId: input.integrationId } },
      create: {
        userId,
        integrationId: input.integrationId,
        config: input.config,
        enabled: input.enabled ?? true,
      },
      update: {
        config: input.config,
        enabled: input.enabled ?? true,
        updatedAt: new Date(),
      },
    })

    return { data: row, error: null }
  } catch (e) {
    console.error('[integrations] saveIntegration error:', e)
    return { data: null, error: 'Failed to save integration' }
  }
}

/**
 * Soft-delete (remove) an integration connection for a user.
 */
export async function deleteIntegration(userId: string, integrationId: string) {
  try {
    await prisma.userIntegration.delete({
      where: { userId_integrationId: { userId, integrationId } },
    })
    return { error: null }
  } catch (e) {
    console.error('[integrations] deleteIntegration error:', e)
    return { error: 'Failed to disconnect integration' }
  }
}

/**
 * Toggle enabled/disabled without changing config.
 */
export async function toggleIntegration(
  userId: string,
  integrationId: string,
  enabled: boolean,
) {
  try {
    const row = await prisma.userIntegration.update({
      where: { userId_integrationId: { userId, integrationId } },
      data: { enabled, updatedAt: new Date() },
    })
    return { data: row, error: null }
  } catch (e) {
    return { data: null, error: 'Failed to toggle integration' }
  }
}

// ── Test connection ───────────────────────────────────────────────────────────

/**
 * Call the adapter's testConnection() without persisting anything.
 * `config` should be the *form* values (not yet saved) to allow testing before save.
 */
export async function testIntegrationConnection(
  integrationId: string,
  config: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const adapter = getAdapter(integrationId)
  if (!adapter) return { ok: false, error: `No adapter found for: ${integrationId}` }
  return adapter.testConnection(config)
}

// ── Sync trigger ─────────────────────────────────────────────────────────────

/**
 * Fire all enabled integrations for a given attendanceId.
 * Called from attendance/lead creation server actions.
 * Errors are logged but never thrown — a failing integration must not break
 * the core registration flow.
 */
export async function triggerIntegrationSync(attendanceId: string) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        user: true,   // Attendee
        webinar: true,
      },
    })

    if (!attendance) return

    // Determine the presenter's userId from the webinar
    const presenterId = attendance.webinar.presenterId

    const connections = await prisma.userIntegration.findMany({
      where: { userId: presenterId, enabled: true },
    })

    if (connections.length === 0) return

    const payload: LeadSyncPayload = {
      attendeeId: attendance.attendeeId,
      attendeeEmail: attendance.user.email,
      attendeeName: attendance.user.name,
      webinarId: attendance.webinarId,
      webinarTitle: attendance.webinar.title,
      attendedType: attendance.attendedType,
      callStatus: attendance.callStatus,
      tags: attendance.webinar.tags ?? [],
      syncedAt: new Date(),
    }

    // Fire all adapters in parallel, swallowing individual errors
    await Promise.allSettled(
      connections.map(async (conn: { integrationId: string; config: unknown }) => {
        const adapter = getAdapter(conn.integrationId)
        if (!adapter) return
        try {
          await adapter.syncLead(payload, conn.config as Record<string, string>)
        } catch (err) {
          console.error(
            `[integrations] ${conn.integrationId} syncLead failed for attendance ${attendanceId}:`,
            err,
          )
        }
      }),
    )
  } catch (e) {
    console.error('[integrations] triggerIntegrationSync error:', e)
  }
}

// ── Available integrations list (registry proxy — safe for client) ────────────

export async function getAvailableIntegrations() {
  return INTEGRATIONS
}
