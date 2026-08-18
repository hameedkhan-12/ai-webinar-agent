import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook, whop } from '@/lib/whop'
import { handleMembershipStatusChange } from '@/actions/whop'

const ACTIVATE_EVENTS = new Set([
  'membership.activated',
  'membership.created',
  'membership.went_valid',
  'payment.succeeded',
  'payment.created',
  'invoice.paid',
  'checkout.completed',
  'checkout.session.completed',
])

const DEACTIVATE_EVENTS = new Set([
  'membership.deactivated',
  'membership.went_invalid',
  'membership.canceled',
  'membership.expired',
  'membership.deleted',
])

async function extractMetadata(event: unknown): Promise<Record<string, string>> {
  if (!event || typeof event !== 'object') return {}

  const raw = event as Record<string, unknown>
  const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>

  const sources = [
    raw.metadata,
    data.metadata,
    (data.membership as Record<string, unknown> | undefined)?.metadata,
    (data.plan as Record<string, unknown> | undefined)?.metadata,
    (data.payment as Record<string, unknown> | undefined)?.metadata,
    (data.checkout_configuration as Record<string, unknown> | undefined)?.metadata,
    data.custom_metadata,
    raw.custom_metadata,
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

  // Fallback: If userId or email is missing, but checkout_configuration_id is present, retrieve it from Whop API
  const checkoutConfigId =
    (data.checkout_configuration_id as string) ||
    (raw.checkout_configuration_id as string) ||
    ((data.membership as Record<string, unknown> | undefined)?.checkout_configuration_id as string)

  if ((!merged.userId || !merged.email) && checkoutConfigId) {
    try {
      const config = await whop.checkoutConfigurations.retrieve(checkoutConfigId)
      if (config && config.metadata) {
        for (const [k, v] of Object.entries(config.metadata)) {
          if (v !== undefined && v !== null && !merged[k]) {
            merged[k] = String(v)
          }
        }
      }
    } catch (err) {
      console.warn('[Whop Webhook] Failed to fetch checkout configuration metadata:', err)
    }
  }

  if (!merged.email) {
    const possibleEmail =
      data.email ??
      raw.email ??
      (data.user as Record<string, unknown> | undefined)?.email ??
      (raw.user as Record<string, unknown> | undefined)?.email ??
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

    const metadata = await extractMetadata(event)
    await handleMembershipStatusChange(metadata, isActivateEvent)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Whop webhook processing error:', error)
    return new NextResponse(`Webhook Error: ${error.message}`, {
      status: 500,
    })
  }
}