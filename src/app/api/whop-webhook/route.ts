import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@/lib/whop'
import { handleMembershipStatusChange } from '@/actions/whop'

const ACTIVATE_EVENTS = new Set([
  'membership.activated',
  'membership.created',
  'membership.went_valid',
  'payment.succeeded',
  'payment.created',
  'invoice.paid',
])

const DEACTIVATE_EVENTS = new Set([
  'membership.deactivated',
  'membership.went_invalid',
])

function extractMetadata(eventData: unknown): Record<string, string> {
  if (!eventData || typeof eventData !== 'object') return {}

  const data = eventData as Record<string, unknown>
  const sources = [
    data.metadata,
    (data.membership as Record<string, unknown> | undefined)?.metadata,
    (data.plan as Record<string, unknown> | undefined)?.metadata,
    (data.payment as Record<string, unknown> | undefined)?.metadata,
    (data.checkout_configuration as Record<string, unknown> | undefined)?.metadata,
    data.custom_metadata,
  ]

  let merged: Record<string, string> = {}
  for (const src of sources) {
    if (src && typeof src === 'object' && !Array.isArray(src)) {
      for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
        if (v !== undefined && v !== null) {
          merged[k] = String(v)
        }
      }
    }
  }

  if (!merged.email) {
    const possibleEmail =
      data.email ??
      (data.user as Record<string, unknown> | undefined)?.email ??
      (data.member as Record<string, unknown> | undefined)?.email ??
      ((data.membership as Record<string, unknown> | undefined)?.user as Record<string, unknown> | undefined)?.email
    if (possibleEmail && typeof possibleEmail === 'string') {
      merged.email = possibleEmail
    }
  }

  return merged
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  try {
    const event = await verifyWebhook(body, req.headers)
    const eventType =
      (event as unknown as { type?: string; action?: string }).type ??
      (event as unknown as { type?: string; action?: string }).action ??
      'unknown'

    const isActivateEvent = ACTIVATE_EVENTS.has(eventType)
    const isDeactivateEvent = DEACTIVATE_EVENTS.has(eventType)

    if (!isActivateEvent && !isDeactivateEvent) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const metadata = extractMetadata(event.data)
    await handleMembershipStatusChange(metadata, isActivateEvent)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Whop webhook processing error:', error)
    return new NextResponse(`Webhook Error: ${error.message}`, {
      status: 500,
    })
  }
}